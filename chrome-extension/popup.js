const banner = document.getElementById("banner");
const syncBtn = document.getElementById("syncBtn");
const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");

function formatSummary(stats) {
  const parts = [
    `${stats.synced ?? 0} synced`,
    `${stats.duplicate ?? 0} already synced`,
    `${stats.skipped ?? 0} skipped`,
    `${stats.failed ?? 0} failed`,
  ];
  return parts.join(", ");
}

function renderIdle(lastRunStats) {
  if (!lastRunStats) {
    statusEl.textContent = "No syncs yet.";
    detailsEl.hidden = true;
    return;
  }
  const minsAgo = Math.round((Date.now() - lastRunStats.timestamp) / 60000);
  statusEl.textContent = `Last synced ${minsAgo} min ago — ${formatSummary(lastRunStats)}`;
  renderDetails(lastRunStats);
}

function renderProgress(stats) {
  if (stats.aborted === "unauthorized") {
    statusEl.textContent = "Sync stopped: backend rejected the API secret. Check Options.";
    return;
  }
  statusEl.textContent = `Syncing... ${stats.processed} / ${stats.total} (${formatSummary(stats)})`;
  renderDetails(stats);
}

function renderDetails(stats) {
  const lines = [];
  if (stats.skippedReasons && Object.keys(stats.skippedReasons).length > 0) {
    const breakdown = Object.entries(stats.skippedReasons)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join(", ");
    lines.push(`Skipped — ${breakdown}`);
  }
  if (stats.failures && stats.failures.length > 0) {
    lines.push("Failures:");
    for (const f of stats.failures.slice(0, 20)) {
      lines.push(`  ${f.authorName ?? "?"} — ${f.reason}${f.detail ? `: ${JSON.stringify(f.detail)}` : ""}`);
    }
  }
  if (lines.length > 0) {
    detailsEl.textContent = lines.join("\n");
    detailsEl.hidden = false;
  } else {
    detailsEl.hidden = true;
  }
}

async function init() {
  const { backendUrl, apiSecret } = await chrome.storage.sync.get(["backendUrl", "apiSecret"]);
  const configured = Boolean(backendUrl && apiSecret);
  banner.hidden = configured;
  syncBtn.disabled = !configured;

  const { lastRunStats } = await chrome.storage.local.get(["lastRunStats"]);
  renderIdle(lastRunStats);

  const inProgress = await chrome.runtime.sendMessage({ type: "GET_STATUS" }).catch(() => null);
  if (inProgress?.inProgress) {
    renderProgress(inProgress.stats);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SYNC_PROGRESS") {
    syncBtn.disabled = true;
    renderProgress(message.payload);
  }
  if (message?.type === "SYNC_COMPLETE") {
    syncBtn.disabled = false;
    renderIdle({ ...message.payload, timestamp: Date.now() });
  }
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  statusEl.textContent = "Starting...";
  detailsEl.hidden = true;

  const result = await chrome.runtime.sendMessage({ type: "START_SYNC" });

  if (result?.error) {
    statusEl.textContent = result.error;
    syncBtn.disabled = false;
    return;
  }

  syncBtn.disabled = false;
  renderIdle({ ...result, timestamp: Date.now() });
});

document.getElementById("optionsLink").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

document.getElementById("openOptionsFromBanner").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

init();
