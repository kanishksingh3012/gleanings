# Gleanings — Browser Extension

Manifest V3 extension (Chrome, Brave, Edge) that saves LinkedIn posts to your Gleanings library.

## Install

1. Open `chrome://extensions` (or `brave://extensions`) and turn on **Developer mode**.
2. Click **Load unpacked** and select this `chrome-extension/` folder.
3. Open the extension's **Settings** and enter:
   - **Backend URL** — your deployment, e.g. `https://your-app.vercel.app`
   - **API Secret Key** — the `API_SECRET_KEY` from your deployment's environment variables
4. Click **Save** and accept the permission prompt for your backend's domain.

After loading or updating the extension, refresh any open LinkedIn tabs.

## Three ways to save

- **Floating box** — a **🌾 Gleanings** pill sits bottom-right on every LinkedIn page. Open it, paste any post link, and press **Save**. On a post's own page the link is filled in for you.
- **Right-click** — right-click a post's link (e.g. its timestamp) → **Save post to Gleanings**, or right-click anywhere on a post's own page → **Save this post to Gleanings**.
- **Pasted link from anywhere** — links you copied from the LinkedIn app or elsewhere work too, including `lnkd.in` short links.

For a link that isn't the page you're on, the extension opens it in a background tab, reads it, and closes the tab — you stay where you are.

## Troubleshooting

- **No pill on LinkedIn** → refresh the tab (needed once after installing or updating the extension).
- **"The AI is busy"** → Gemini's free tier is rate-limited; wait a minute and save again.
- **"API secret rejected"** → the key in Settings doesn't match the deployment's `API_SECRET_KEY`.
- **"Couldn't read that post"** → LinkedIn changed its page layout. Open DevTools on the post, filter the Console for `[Gleanings]`, and note the reason shown.
