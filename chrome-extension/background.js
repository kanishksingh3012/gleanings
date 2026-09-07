const LOG_PREFIX = "[LI-Sync]";
const SYNC_DELAY_MS = 300;
const MAX_STORED_URNS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function originPattern(urlString) {
  const url = new URL(urlString);
  return `${url.origin}/*`;
}

// Mirrors manifest.json's content_scripts matches: the saved-posts list
// (many posts, bulk sync) or an individual post's own permalink page (just
// that one post) — content.js's card-detection logic already handles both
// generically (a list page yields many card elements, a single-post page
// yields one), so the only thing that differs here is which tab we target.
const SUPPORTED_LINKEDIN_PATTERNS = [
  /^https:\/\/www\.linkedin\.com\/my-items\/saved-posts\//,
  /^https:\/\/www\.linkedin\.com\/feed\/update\//,
  /^https:\/\/www\.linkedin\.com\/posts\//,
];

function isSupportedLinkedInUrl(url) {
  return Boolean(url) && SUPPORTED_LINKEDIN_PATTERNS.some((pattern) => pattern.test(url));
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

async function runSync() {
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

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !isSupportedLinkedInUrl(activeTab.url)) {
    return {
      error:
        "Open a LinkedIn saved-posts list or an individual post's own page first, then click Sync.",
    };
  }
  const tab = activeTab;

  let scrapeResult;
  try {
    // The listener must be registered BEFORE sending RUN_SCRAPE: the content
    // script broadcasts SCRAPE_RESULT before it resolves its own sendResponse
    // (which can be ~20s later, after scrollAndSettle), so awaiting
    // chrome.tabs.sendMessage first would register this listener too late
    // and miss the message.
    scrapeResult = await new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message?.type === "SCRAPE_RESULT") {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(message.payload);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      chrome.tabs.sendMessage(tab.id, { type: "RUN_SCRAPE" }).catch((err) => {
        chrome.runtime.onMessage.removeListener(listener);
        reject(err);
      });
    });
  } catch (err) {
    return { error: `Could not reach the LinkedIn tab's content script: ${err}` };
  }

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "START_SYNC") {
    if (currentRunStats) {
      sendResponse({ error: "A sync is already in progress." });
      return true;
    }
    runSync().then(sendResponse);
    return true;
  }
  if (message?.type === "GET_STATUS") {
    if (currentRunStats) {
      sendResponse({ inProgress: true, stats: currentRunStats });
    } else {
      chrome.storage.local
        .get(["lastRunStats"])
        .then(({ lastRunStats }) => sendResponse({ inProgress: false, lastRunStats }));
    }
    return true;
  }
  return undefined;
});
