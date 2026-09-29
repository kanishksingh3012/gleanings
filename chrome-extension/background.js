const LOG_PREFIX = "[Gleanings]";
const SYNC_DELAY_MS = 300;
const MAX_STORED_URNS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function originPattern(urlString) {
  const url = new URL(urlString);
  return `${url.origin}/*`;
}

// A single post's own page, or a LinkedIn short link that redirects to one.
const POST_URL_PATTERNS = [
  /^https:\/\/(www\.)?linkedin\.com\/feed\/update\/urn:li:(activity|share|ugcPost):\d+/,
  /^https:\/\/(www\.)?linkedin\.com\/posts\//,
  /^https:\/\/lnkd\.in\//,
];

function isPostUrl(url) {
  return Boolean(url) && POST_URL_PATTERNS.some((pattern) => pattern.test(url));
}

async function getSyncedUrns() {
  const { syncedUrns } = await chrome.storage.local.get(["syncedUrns"]);
  return new Set(syncedUrns ?? []);
}

async function addSyncedUrns(newUrns) {
  const current = await getSyncedUrns();
  for (const urn of newUrns) current.add(urn);
  let list = Array.from(current);
  if (list.length > MAX_STORED_URNS) {
    list = list.slice(list.length - MAX_STORED_URNS);
  }
  await chrome.storage.local.set({ syncedUrns: list });
}

async function saveLastRunStats(stats) {
  await chrome.storage.local.set({
    lastRunStats: { ...stats, timestamp: Date.now() },
  });
}

function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // No popup listening right now — fine, it reads lastRunStats on open.
  });
}

// Tracked so a popup reopened mid-run can show live progress instead of
// resetting to idle (GET_STATUS reads this).
let currentRunStats = null;

async function syncOne(item, backendUrl, apiSecret) {
  try {
    const res = await fetch(`${backendUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(item),
    });

    if (res.status === 401) {
      return { outcome: "unauthorized" };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { outcome: "failed", reason: `http_${res.status}`, detail: body.error };
    }

    const body = await res.json();
    return body.duplicate
      ? { outcome: "duplicate", urn: item.linkedin_urn }
      : { outcome: "synced", urn: item.linkedin_urn };
  } catch (err) {
    return { outcome: "failed", reason: "network_error", detail: String(err) };
  }
}

/**
 * Reads backendUrl/apiSecret from storage and confirms we still hold host
 * permission for that origin. Returns { error } or { backendUrl, apiSecret }.
 * Shared by both sync entry points (popup-triggered and widget-triggered)
 * since both need the exact same preconditions checked.
 */
async function getBackendConfig() {
  const { backendUrl, apiSecret } = await chrome.storage.sync.get(["backendUrl", "apiSecret"]);
  if (!backendUrl || !apiSecret) {
    return { error: "Not configured. Open Options and set a Backend URL + API Secret Key." };
  }

  let origin;
  try {
    origin = originPattern(backendUrl);
  } catch {
    return { error: "Stored Backend URL is invalid. Re-save it in Options." };
  }

  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  if (!hasPermission) {
    return { error: "Missing permission for the backend URL. Re-save it in Options." };
  }

  return { backendUrl, apiSecret };
}

/**
 * Takes an already-scraped {extracted, skipped} payload and runs the
 * dedup + sequential-POST sync loop, broadcasting progress along the way.
 * Shared by runSync() (which first has to find a tab and ask its content
 * script to scrape) and the widget flow (which already has the payload,
 * since the button lives inside the tab it's syncing — no tab lookup needed).
 */
async function processScrapeResult(scrapeResult, backendUrl, apiSecret) {
  const syncedUrns = await getSyncedUrns();
  const queue = scrapeResult.extracted.filter((item) => !syncedUrns.has(item.linkedin_urn));
  const alreadyKnownCount = scrapeResult.extracted.length - queue.length;

  const stats = {
    total: queue.length,
    processed: 0,
    synced: 0,
    duplicate: alreadyKnownCount,
    skipped: scrapeResult.skipped.length,
    failed: 0,
    skippedReasons: scrapeResult.skipped.reduce((acc, s) => {
      acc[s.reason] = (acc[s.reason] ?? 0) + 1;
      return acc;
    }, {}),
    failures: [],
  };
  currentRunStats = stats;

  const newlySynced = [];

  for (const item of queue) {
    const result = await syncOne(item, backendUrl, apiSecret);
    stats.processed++;

    if (result.outcome === "unauthorized") {
      stats.aborted = "unauthorized";
      broadcast({ type: "SYNC_PROGRESS", payload: { ...stats } });
      break;
    }

    if (result.outcome === "synced") {
      stats.synced++;
      newlySynced.push(result.urn);
    } else if (result.outcome === "duplicate") {
      stats.duplicate++;
      newlySynced.push(result.urn);
    } else {
      stats.failed++;
      stats.failures.push({
        authorName: item.authorName,
        reason: result.reason,
        detail: result.detail,
      });
      console.warn(`${LOG_PREFIX} sync failed for ${item.linkedin_urn}:`, result);
    }

    broadcast({ type: "SYNC_PROGRESS", payload: { ...stats } });

    if (stats.aborted) break;
    await sleep(SYNC_DELAY_MS);
  }

  if (newlySynced.length > 0) {
    await addSyncedUrns(newlySynced);
  }

  await saveLastRunStats(stats);
  broadcast({ type: "SYNC_COMPLETE", payload: stats });
  currentRunStats = null;
  return stats;
}


const PAGE_LOAD_TIMEOUT_MS = 30_000;
const CONTENT_SCRIPT_RETRIES = 20;

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("The post took too long to load."));
    }, PAGE_LOAD_TIMEOUT_MS);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/** Asks a tab's content script to extract its post, retrying until the script is injected. */
async function extractFromTab(tabId) {
  for (let attempt = 0; attempt < CONTENT_SCRIPT_RETRIES; attempt++) {
    try {
      const result = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_SINGLE_POST" });
      if (result) return result;
    } catch {
      // Content script not ready yet (or page not on linkedin.com).
    }
    await sleep(1000);
  }
  throw new Error("Couldn't read that page. Is it a LinkedIn post?");
}

/**
 * Saves a post from its link without the user leaving the page: opens it in
 * a background tab, extracts it with the same logic as the on-page Save, and
 * always closes the tab afterwards.
 */
async function saveUrl(url) {
  if (!isPostUrl(url)) {
    return { error: "Paste a link to a single LinkedIn post (…/feed/update/… or …/posts/…)." };
  }
  const config = await getBackendConfig();
  if (config.error) return config;

  let tabId;
  try {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;
    await waitForTabComplete(tabId);
    const scrapeResult = await extractFromTab(tabId);
    return await processScrapeResult(scrapeResult, config.backendUrl, config.apiSecret);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (tabId !== undefined) chrome.tabs.remove(tabId).catch(() => {});
  }
}

async function syncExtracted(scrapeResult) {
  const config = await getBackendConfig();
  if (config.error) return config;
  return processScrapeResult(scrapeResult, config.backendUrl, config.apiSecret);
}

/** Only one save at a time: saves are sequential to respect the AI's rate limit. */
function exclusive(task) {
  if (currentRunStats) return Promise.resolve({ error: "Another save is in progress — try again in a moment." });
  return task();
}

// --- Right-click "Save to Gleanings" ------------------------------------------

const POST_URL_MATCH = [
  "https://www.linkedin.com/feed/update/*",
  "https://www.linkedin.com/posts/*",
  "https://lnkd.in/*",
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-link",
      title: "Save post to Gleanings",
      contexts: ["link"],
      targetUrlPatterns: POST_URL_MATCH,
    });
    chrome.contextMenus.create({
      id: "save-page",
      title: "Save this post to Gleanings",
      contexts: ["page"],
      documentUrlPatterns: POST_URL_MATCH,
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  const notify = (payload) => chrome.tabs.sendMessage(tab.id, { type: "SAVE_STATUS", ...payload }).catch(() => {});
  notify({ pending: true });

  const result =
    info.menuItemId === "save-page"
      ? await exclusive(async () => syncExtracted(await extractFromTab(tab.id)))
      : await exclusive(() => saveUrl(info.linkUrl));
  notify({ result });
});

// --- Messages from the page box and popup --------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_URL") {
    exclusive(() => saveUrl(message.url)).then(sendResponse);
    return true;
  }
  if (message?.type === "SYNC_EXTRACTED") {
    exclusive(() => syncExtracted(message.payload)).then(sendResponse);
    return true;
  }
  if (message?.type === "GET_STATUS") {
    chrome.storage.local.get(["lastRunStats"]).then(({ lastRunStats }) => sendResponse({ lastRunStats }));
    return true;
  }
  if (message?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
  }
  return undefined;
});
