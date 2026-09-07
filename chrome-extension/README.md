# LinkedIn Post Sync — Chrome Extension

Manifest V3 extension that scrapes your LinkedIn saved-posts page and syncs each post to the backend's `/api/sync` endpoint. Built best-effort against LinkedIn's documented DOM patterns, **without live testing against a real logged-in LinkedIn session** — so the first real run will very likely need some selector adjustments. That's expected; see "If something doesn't work" below.

## Load it

1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `chrome-extension/` folder.

## Configure it

1. Click the extension's icon in the toolbar → it should show a "Not configured" banner → click **Open Options** (or right-click the icon → Options).
2. Enter:
   - **Backend URL** — e.g. `http://localhost:3000` while running `npm run dev` locally, or your deployed URL.
   - **API Secret Key** — the exact value of `API_SECRET_KEY` from the backend's `.env.local`.
3. Click **Save** and **accept the Chrome permission prompt** that appears — this is expected; it's asking for permission to talk to the backend URL you just entered. Denying it means sync will not work until you save again and accept.

## Use it

Two ways to sync, same button — the extension looks at whatever LinkedIn tab is currently active:

- **Sync everything saved**: open `https://www.linkedin.com/my-items/saved-posts/`, let the list load, click the extension icon → **Sync This Page**. It scrapes and syncs every card currently visible (auto-scrolling to load more first).
- **Sync just one post**: open that post's own page (e.g. click its timestamp/permalink to land on a `linkedin.com/feed/update/...` or `linkedin.com/posts/...` URL, not the saved-posts list), then click the extension icon → **Sync This Page**. Only that one post gets synced.

Steps:
1. Navigate to whichever of the two page types above you want.
2. (Recommended for the first run) Open DevTools (`F12` / `Cmd+Opt+I`) on that tab and go to the Console — filter for `[LI-Sync]` to see per-card diagnostics.
3. Click the extension icon → **Sync This Page**.
4. Watch the popup for live progress, then a final summary like "18 synced, 3 already synced, 2 skipped, 1 failed" (or "1 synced" for a single post).

**If you see "Could not establish connection. Receiving end does not exist."** — this means the content script wasn't injected into that tab yet, almost always because the tab was already open *before* you loaded/reloaded the extension (Chrome only injects content scripts on page load). Fix: go to `chrome://extensions` (or `brave://extensions`) and click the reload icon on this extension, then **refresh the LinkedIn tab** and try again.

## If something doesn't work

The scraper's selectors were written from the project's spec, not verified against a real live LinkedIn page. Report back with whichever of these applies — each maps to one specific fix, not a rewrite:

- **"0 cards found" / summary shows all zeros** → the container-scoping selectors aren't matching current LinkedIn markup at all. Right-click one saved post card on the page → **Inspect** → copy its outer HTML and send it to me.
- **Cards found but mostly skipped** → the popup's expandable details show a skip-reason breakdown (e.g. `no_urn: 5, no_author: 5`). Send me that breakdown — each reason maps to exactly one selector in `content.js` (`no_urn` → the URN extraction logic, `no_author` → the `a[href*="/in/"]` selector, `no_permalink` → the post-link selector, `no_text` → the text-body selector).
- **Posts sync but the text looks wrong** (garbled, truncated, includes "Like Comment Share" noise) → copy one example from the console's `[LI-Sync] extracted` log entry and send it over.
- **Requests fail with a 400** → the popup's failure details show the backend's exact validation error (e.g. "authorUrl must be a valid URL") — that maps directly to a field the extension is producing incorrectly.
- **Nothing happens when clicking Sync** → confirm the LinkedIn saved-posts tab is actually open, and check what error the popup shows.
