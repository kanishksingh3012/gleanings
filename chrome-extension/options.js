const backendUrlInput = document.getElementById("backendUrl");
const apiSecretInput = document.getElementById("apiSecret");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");

function originPattern(urlString) {
  const url = new URL(urlString);
  return `${url.origin}/*`;
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind ?? "";
}

async function loadSettings() {
  const { backendUrl, apiSecret } = await chrome.storage.sync.get(["backendUrl", "apiSecret"]);
  if (backendUrl) backendUrlInput.value = backendUrl;
  if (apiSecret) apiSecretInput.value = apiSecret;
}

async function handleSave() {
  const backendUrl = backendUrlInput.value.trim();
  const apiSecret = apiSecretInput.value.trim();

  if (!backendUrl || !apiSecret) {
    setStatus("Both fields are required.", "error");
    return;
  }

  let newOrigin;
  try {
    newOrigin = originPattern(backendUrl);
  } catch {
    setStatus("Backend URL must be a valid URL (e.g. http://localhost:3000).", "error");
    return;
  }

  saveButton.disabled = true;
  setStatus("Requesting permission...");

  const { backendUrl: previousBackendUrl } = await chrome.storage.sync.get(["backendUrl"]);

  let granted;
  try {
    granted = await chrome.permissions.request({ origins: [newOrigin] });
  } catch (err) {
    saveButton.disabled = false;
    setStatus(`Could not request permission: ${err}`, "error");
    return;
  }

  saveButton.disabled = false;

  if (!granted) {
    setStatus(
      "Permission denied. The extension cannot sync until you grant access to this URL.",
      "error",
    );
    return;
  }

  if (previousBackendUrl) {
    let previousOrigin;
    try {
      previousOrigin = originPattern(previousBackendUrl);
    } catch {
      previousOrigin = null;
    }
    if (previousOrigin && previousOrigin !== newOrigin) {
      try {
        await chrome.permissions.remove({ origins: [previousOrigin] });
      } catch (err) {
        console.warn("[Gleanings] failed to revoke stale permission", err);
      }
    }
  }

  await chrome.storage.sync.set({ backendUrl, apiSecret });
  setStatus("Saved.", "success");
}

saveButton.addEventListener("click", handleSave);
loadSettings();
