const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const libraryBtn = document.getElementById("library");

async function init() {
  const { backendUrl, apiSecret } = await chrome.storage.sync.get(["backendUrl", "apiSecret"]);
  if (!backendUrl || !apiSecret) {
    dot.className = "dot bad";
    statusText.textContent = "Not set up — open Settings.";
    return;
  }

  const origin = `${new URL(backendUrl).origin}/*`;
  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  dot.className = hasPermission ? "dot ok" : "dot bad";
  statusText.textContent = hasPermission
    ? `Connected to ${new URL(backendUrl).hostname}`
    : "Permission missing — re-save Settings.";

  libraryBtn.hidden = false;
  libraryBtn.addEventListener("click", () => chrome.tabs.create({ url: backendUrl }));
}

document.getElementById("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
init();
