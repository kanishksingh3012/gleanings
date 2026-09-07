const LOG_PREFIX = "[LI-Sync]";
const MAX_RAW_TEXT_LENGTH = 20_000;
const UI_CHROME_LINE = /^(like|comment|share|send|repost|·|\d+\s*(h|hr|d|w|mo|y)\b.*)$/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCardElements() {
  const scoped = document.querySelectorAll(".reusable-search__result-container");
  if (scoped.length > 0) return Array.from(scoped);
  // Fallback: the class above is obfuscated/renamed on this run of LinkedIn's
  // markup — fall back to a structural heuristic instead of giving up.
  return Array.from(document.querySelectorAll("div[data-urn], li[data-urn]"));
}

function extractUrn(card) {
  const own = card.getAttribute("data-urn");
  if (own) return own;

  const ancestor = card.closest("[data-urn]");
  if (ancestor && ancestor !== card) return ancestor.getAttribute("data-urn");

  const descendant = card.querySelector("[data-urn]");
  if (descendant) return descendant.getAttribute("data-urn");

  const anchors = card.querySelectorAll("a[href]");
  for (const anchor of anchors) {
    const match = anchor.href.match(/urn:li:(activity|share|ugcPost):\d+/);
    if (match) return match[0];
  }

  return null;
}

function canonicalizeUrl(href) {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return href;
  }
}

function extractAuthor(card) {
  // LinkedIn often wraps the same profile in two separate anchors — one
  // around just the avatar image (empty text) and one around the visible
  // name — so scan all candidates rather than assuming the first is the
  // one with text.
  const anchors = card.querySelectorAll('a[href*="/in/"], a[href*="/company/"]');
  for (const anchor of anchors) {
    const name = anchor.innerText?.trim() || anchor.getAttribute("aria-label")?.trim();
    if (name) {
      return { authorName: name, authorUrl: canonicalizeUrl(anchor.href), authorAnchor: anchor };
    }
  }
  return null;
}

function extractAvatar(card, authorAnchor) {
  const nearImg = authorAnchor?.closest("div")?.querySelector("img") ?? card.querySelector("img");
  const src = nearImg?.getAttribute("src");
  if (!src || src.startsWith("data:")) return null;
  return src;
}

function extractPermalink(card, urn) {
  const anchor = card.querySelector(
    'a[href*="/feed/update/"], a.app-aware-link[href*="urn:li:activity"]',
  );
  if (anchor) return canonicalizeUrl(anchor.href);

  const match = urn?.match(/urn:li:activity:(\d+)/);
  if (match) return `https://www.linkedin.com/feed/update/urn:li:activity:${match[1]}/`;

  return null;
}

function extractRawText(card) {
  const candidates = Array.from(card.querySelectorAll('span[dir="ltr"], div[dir="ltr"]'));
  let best = "";
  for (const el of candidates) {
    const text = el.innerText?.trim() ?? "";
    if (text.length > best.length) best = text;
  }

  if (best) return best.slice(0, MAX_RAW_TEXT_LENGTH);

  const lines = (card.innerText ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !UI_CHROME_LINE.test(line));
  return lines.join(" ").slice(0, MAX_RAW_TEXT_LENGTH);
}

function extractCard(card, index) {
  const urn = extractUrn(card);
  if (!urn) return { ok: false, index, reason: "no_urn" };

  const author = extractAuthor(card);
  if (!author) return { ok: false, index, reason: "no_author" };

  const originalPostUrl = extractPermalink(card, urn);
  if (!originalPostUrl) return { ok: false, index, reason: "no_permalink" };

  const rawText = extractRawText(card);
  if (!rawText) return { ok: false, index, reason: "no_text" };

  return {
    ok: true,
    data: {
      linkedin_urn: urn,
      authorName: author.authorName,
      authorUrl: author.authorUrl,
      authorAvatarUrl: extractAvatar(card, author.authorAnchor),
      rawText,
      originalPostUrl,
    },
  };
}

// --- Single-post page extraction -------------------------------------------
// This LinkedIn build has NO `data-urn` attribute anywhere in the DOM
// (confirmed via live inspection), so the card-based extraction above can't
// find a URN at all on this page. But when the user is on a post's own page
// (not the saved-posts list), the URL itself already encodes the activity
// ID — no DOM digging needed. This is the primary path now, since the user
// prefers syncing one post at a time from its own page anyway.

function isSinglePostPage() {
  return /^\/(feed\/update|posts)\//.test(window.location.pathname);
}

function extractUrnFromUrl(href) {
  // Plain form: /feed/update/urn:li:activity:1234567890123456789/
  let match = href.match(/urn:li:(activity|share|ugcPost):(\d+)/);
  if (match) return `urn:li:${match[1]}:${match[2]}`;

  // URL-encoded colon form: .../urn%3Ali%3Aactivity%3A1234567890123456789
  match = href.match(/urn%3Ali%3A(activity|share|ugcPost)%3A(\d+)/i);
  if (match) return `urn:li:${match[1]}:${match[2]}`;

  // Slug form: /posts/username_some-slug-activity-1234567890123456789-AbCd/
  match = href.match(/-activity-(\d+)-/);
  if (match) return `urn:li:activity:${match[1]}`;

  return null;
}

function extractSinglePost() {
  const urn = extractUrnFromUrl(window.location.href);
  if (!urn) return { ok: false, index: 0, reason: "no_urn_in_url" };

  const author = extractAuthor(document);
  if (!author) return { ok: false, index: 0, reason: "no_author" };

  const rawText = extractRawText(document);
  if (!rawText) return { ok: false, index: 0, reason: "no_text" };

  return {
    ok: true,
    data: {
      linkedin_urn: urn,
      authorName: author.authorName,
      authorUrl: author.authorUrl,
      authorAvatarUrl: extractAvatar(document, author.authorAnchor),
      rawText,
      originalPostUrl: canonicalizeUrl(window.location.href),
    },
  };
}

function extractSinglePostResult() {
  const result = extractSinglePost();
  if (result.ok) {
    console.log(`${LOG_PREFIX} extracted (single post)`, result.data);
    return { extracted: [result.data], skipped: [], totalCardsFound: 1 };
  }
  console.warn(`${LOG_PREFIX} skipped single post: ${result.reason}`);
  return {
    extracted: [],
    skipped: [{ index: 0, reason: result.reason }],
    totalCardsFound: 1,
  };
}

function extractAllCards() {
  const cards = getCardElements();
  const extracted = [];
  const skipped = [];

  cards.forEach((card, index) => {
    const result = extractCard(card, index);
    if (result.ok) {
      extracted.push(result.data);
    } else {
      skipped.push({ index, reason: result.reason });
      console.warn(`${LOG_PREFIX} skipped card #${index}: ${result.reason}`, card);
    }
  });

  console.log(`${LOG_PREFIX} extracted`, { extracted, skipped, totalCardsFound: cards.length });
  return { extracted, skipped, totalCardsFound: cards.length };
}

async function scrollAndSettle() {
  let lastCount = getCardElements().length;
  let stableChecks = 0;

  for (let i = 0; i < 20 && stableChecks < 2; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(1000);
    const count = getCardElements().length;
    if (count === lastCount) {
      stableChecks++;
    } else {
      stableChecks = 0;
      lastCount = count;
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "RUN_SCRAPE") {
    (async () => {
      let payload;
      if (isSinglePostPage()) {
        payload = extractSinglePostResult();
      } else {
        await scrollAndSettle();
        payload = extractAllCards();
      }
      chrome.runtime.sendMessage({ type: "SCRAPE_RESULT", payload });
      sendResponse({ ok: true });
    })();
    return true; // keep the message channel open for the async response
  }
  return undefined;
});

// Lightweight visibility tracking only — does not trigger any network calls.
// Actual scraping only happens on an explicit RUN_SCRAPE message from the popup.
const seenCards = new WeakSet();
let debounceTimer = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    for (const card of getCardElements()) seenCards.add(card);
  }, 800);
});
observer.observe(document.body, { childList: true, subtree: true });
