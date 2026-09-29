const LOG_PREFIX = "[Gleanings]";
const MAX_RAW_TEXT_LENGTH = 20_000;
const UI_CHROME_LINE = /^(like|comment|share|send|repost|·|\d+\s*(h|hr|d|w|mo|y)\b.*)$/i;
const POST_PATH = /^\/(feed\/update|posts)\//;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canonicalizeUrl(href) {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return href;
  }
}

function isPostPage() {
  return POST_PATH.test(window.location.pathname);
}

// --- Extraction (single post page) -------------------------------------------
// LinkedIn's markup uses obfuscated, ever-changing class names, but a post's
// own page URL always carries its activity ID — so the URN comes from the URL,
// and author/text come from structural selectors inside the main landmark.

function extractUrnFromUrl(href) {
  let match = href.match(/urn:li:(activity|share|ugcPost):(\d+)/);
  if (match) return `urn:li:${match[1]}:${match[2]}`;
  match = href.match(/urn%3Ali%3A(activity|share|ugcPost)%3A(\d+)/i);
  if (match) return `urn:li:${match[1]}:${match[2]}`;
  match = href.match(/-activity-(\d+)-/);
  if (match) return `urn:li:activity:${match[1]}`;
  return null;
}

function extractAuthor(root) {
  // The same profile is often linked twice (avatar-only + name), and the name
  // anchor can nest the connection badge ("· 3rd+") on its own line.
  for (const anchor of root.querySelectorAll('a[href*="/in/"], a[href*="/company/"]')) {
    const firstLine = anchor.innerText?.trim().split("\n").find((line) => line.trim())?.trim();
    const name = firstLine || anchor.getAttribute("aria-label")?.trim();
    if (name) return { authorName: name, authorUrl: canonicalizeUrl(anchor.href), authorAnchor: anchor };
  }
  return null;
}

function extractAvatar(root, authorAnchor) {
  const img = authorAnchor?.closest("div")?.querySelector("img") ?? root.querySelector("img");
  const src = img?.getAttribute("src");
  return src && !src.startsWith("data:") ? src : null;
}

function extractRawText(root) {
  let best = "";
  for (const el of root.querySelectorAll('span[dir="ltr"], div[dir="ltr"]')) {
    const text = el.innerText?.trim() ?? "";
    if (text.length > best.length) best = text;
  }
  if (best) return best.slice(0, MAX_RAW_TEXT_LENGTH);

  return (root.innerText ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !UI_CHROME_LINE.test(line))
    .join(" ")
    .slice(0, MAX_RAW_TEXT_LENGTH);
}

function extractSinglePost() {
  const root = document.querySelector('section[aria-label="Primary content"]') ?? document.body;
  const urn = extractUrnFromUrl(window.location.href);
  if (!urn) return { ok: false, reason: "no_urn_in_url" };
  const author = extractAuthor(root);
  if (!author) return { ok: false, reason: "no_author" };
  const rawText = extractRawText(root);
  if (!rawText) return { ok: false, reason: "no_text" };
  return {
    ok: true,
    data: {
      linkedin_urn: urn,
      authorName: author.authorName,
      authorUrl: author.authorUrl,
      authorAvatarUrl: extractAvatar(root, author.authorAnchor),
      rawText,
      originalPostUrl: canonicalizeUrl(window.location.href),
    },
  };
}

/** Retries while the page is still rendering (background tabs render lazily). */
async function extractWhenReady(maxWaitMs = 10_000) {
  const deadline = Date.now() + maxWaitMs;
  let result;
  do {
    result = extractSinglePost();
    if (result.ok) break;
    await sleep(700);
  } while (Date.now() < deadline);

  if (!result.ok) console.warn(`${LOG_PREFIX} extraction failed: ${result.reason}`);
  return result.ok
    ? { extracted: [result.data], skipped: [], totalCardsFound: 1 }
    : { extracted: [], skipped: [{ index: 0, reason: result.reason }], totalCardsFound: 1 };
}

// --- Result → message --------------------------------------------------------

const SKIP_MESSAGES = {
  no_urn_in_url: "That doesn't look like a single post.",
  no_author: "Couldn't find the post's author on the page.",
  no_text: "Couldn't read the post's text.",
};

function describeResult(result) {
  if (!result) return { text: "No response from the extension. Reload the page.", kind: "error" };
  if (result.error) return { text: result.error, kind: "error" };
  if (result.aborted === "unauthorized") return { text: "API secret rejected — check the extension Settings.", kind: "error" };
  if (result.skipped > 0) {
    const reason = Object.keys(result.skippedReasons ?? {})[0];
    return { text: SKIP_MESSAGES[reason] ?? "Couldn't read that post.", kind: "error" };
  }
  if (result.failed > 0) {
    const detail = String(result.failures?.[0]?.detail ?? "");
    const busy = /high demand|quota|429|503/i.test(detail);
    return { text: busy ? "The AI is busy — try again in a minute." : "Saving failed. Try again.", kind: "error" };
  }
  if (result.duplicate > 0) return { text: "Already in your library.", kind: "info" };
  return { text: "Saved to Gleanings.", kind: "success" };
}

// --- Floating box ------------------------------------------------------------

const STYLES = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
  .pill {
    display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px;
    border: none; border-radius: 999px; background: #18181b; color: #fff;
    font-size: 13px; font-weight: 600; cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,.18);
  }
  .pill:hover { background: #27272a; }
  .panel {
    width: 320px; padding: 14px; border-radius: 16px; background: #fff; color: #18181b;
    border: 1px solid #e4e4e7; box-shadow: 0 16px 40px rgba(0,0,0,.18);
    display: flex; flex-direction: column; gap: 10px;
  }
  .head { display: flex; align-items: center; justify-content: space-between; }
  .title { font-size: 14px; font-weight: 700; }
  .icon-btn { border: none; background: none; cursor: pointer; color: #71717a; font-size: 18px; line-height: 1; padding: 2px 6px; border-radius: 8px; }
  .icon-btn:hover { background: #f4f4f5; color: #18181b; }
  .row { display: flex; gap: 6px; }
  input {
    flex: 1; min-width: 0; height: 36px; padding: 0 10px; border-radius: 10px;
    border: 1px solid #e4e4e7; background: #fafafa; color: #18181b; font-size: 13px; outline: none;
  }
  input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
  .save {
    height: 36px; padding: 0 14px; border: none; border-radius: 10px;
    background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .save:hover:not(:disabled) { background: #1d4ed8; }
  .save:disabled { opacity: .55; cursor: default; }
  .hint { font-size: 12px; color: #71717a; min-height: 16px; }
  .status { font-size: 12.5px; min-height: 18px; }
  .status.success { color: #15803d; }
  .status.error { color: #dc2626; }
  .status.info { color: #52525b; }
  .foot { display: flex; justify-content: space-between; font-size: 12px; }
  a { color: #2563eb; text-decoration: none; cursor: pointer; }
  a:hover { text-decoration: underline; }
  [hidden] { display: none !important; }
`;

function injectWidget() {
  const host = document.createElement("div");
  // Above LinkedIn's docked messaging bar in the bottom-right corner.
  host.style.cssText = "position:fixed;z-index:2147483647;bottom:84px;right:24px;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${STYLES}</style>
    <button class="pill" id="pill" aria-expanded="false">🌾 Gleanings</button>
    <div class="panel" id="panel" hidden>
      <div class="head">
        <span class="title">Save to Gleanings</span>
        <button class="icon-btn" id="close" aria-label="Minimize">–</button>
      </div>
      <form class="row" id="form">
        <input id="url" type="url" placeholder="Paste a LinkedIn post link" autocomplete="off" />
        <button class="save" id="save" type="submit">Save</button>
      </form>
      <div class="hint" id="hint"></div>
      <div class="status" id="status" role="status" aria-live="polite"></div>
      <div class="foot">
        <a id="library">Open library ↗</a>
        <a id="options">Settings</a>
      </div>
    </div>
  `;

  const $ = (id) => shadow.getElementById(id);
  const pill = $("pill");
  const panel = $("panel");
  const input = $("url");
  const saveBtn = $("save");
  const hint = $("hint");
  const status = $("status");
  let autoFilled = "";
  let busy = false;

  function setOpen(open) {
    panel.hidden = !open;
    pill.hidden = open;
    pill.setAttribute("aria-expanded", String(open));
    if (open) {
      syncWithPage();
      input.focus();
    }
  }

  function setStatus({ text, kind }) {
    status.textContent = text;
    status.className = `status ${kind ?? ""}`;
  }

  // On a post's own page, pre-fill its link. Re-checked on SPA navigation
  // (LinkedIn changes the URL without reloading), without overwriting a link
  // the user typed themselves.
  function syncWithPage() {
    const current = isPostPage() ? canonicalizeUrl(window.location.href) : "";
    if (input.value === "" || input.value === autoFilled) {
      input.value = current;
      autoFilled = current;
    }
    hint.textContent = current && input.value === current ? "This post is ready to save." : "";
  }

  let lastHref = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      if (!panel.hidden) syncWithPage();
    }
  }, 1000);

  async function save() {
    const url = input.value.trim();
    if (!url || busy) return;
    busy = true;
    saveBtn.disabled = true;
    setStatus({ text: "Saving… this can take a few seconds.", kind: "info" });

    let result;
    try {
      if (isPostPage() && canonicalizeUrl(url) === canonicalizeUrl(window.location.href)) {
        const payload = await extractWhenReady(4000);
        result = payload.extracted.length
          ? await chrome.runtime.sendMessage({ type: "SYNC_EXTRACTED", payload })
          : { skipped: 1, skippedReasons: { [payload.skipped[0].reason]: 1 } };
      } else {
        result = await chrome.runtime.sendMessage({ type: "SAVE_URL", url });
      }
    } catch (err) {
      result = { error: String(err?.message ?? err) };
    }

    const outcome = describeResult(result);
    setStatus(outcome);
    if (outcome.kind !== "error" && input.value !== autoFilled) input.value = "";
    busy = false;
    saveBtn.disabled = false;
  }

  pill.addEventListener("click", () => setOpen(true));
  $("close").addEventListener("click", () => setOpen(false));
  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });
  input.addEventListener("input", () => {
    hint.textContent = "";
    setStatus({ text: "" });
  });
  shadow.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
    e.stopPropagation(); // keep LinkedIn's global shortcuts from firing while typing
  });
  $("library").addEventListener("click", async () => {
    const { backendUrl } = await chrome.storage.sync.get(["backendUrl"]);
    if (backendUrl) window.open(backendUrl, "_blank", "noopener");
    else chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });
  $("options").addEventListener("click", () => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" }));

  return { setOpen, setStatus };
}

const widget = injectWidget();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXTRACT_SINGLE_POST") {
    extractWhenReady().then(sendResponse);
    return true;
  }
  if (message?.type === "SAVE_STATUS") {
    widget.setOpen(true);
    widget.setStatus(message.pending ? { text: "Saving…", kind: "info" } : describeResult(message.result));
  }
  return undefined;
});
