(function attachHandleUtils(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.Xorcism = root.Xorcism || {};
  root.Xorcism.HandleUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

  const RESERVED_ROUTES = new Set([
    "about",
    "account",
    "compose",
    "download",
    "explore",
    "followers",
    "following",
    "hashtag",
    "home",
    "i",
    "intent",
    "jobs",
    "login",
    "logout",
    "messages",
    "notifications",
    "privacy",
    "search",
    "settings",
    "share",
    "signup",
    "tos"
  ]);

  function normaliseHandle(value) {
    if (typeof value !== "string") {
      return null;
    }

    const candidate = value.trim().replace(/^@/, "");

    if (!HANDLE_PATTERN.test(candidate)) {
      return null;
    }

    if (RESERVED_ROUTES.has(candidate.toLowerCase())) {
      return null;
    }

    return candidate;
  }

  function extractHandleFromHref(href, baseUrl = "https://x.com") {
    if (typeof href !== "string" || href.length === 0) {
      return null;
    }

    let url;

    try {
      url = new URL(href, baseUrl);
    } catch {
      return null;
    }

    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length !== 1) {
      return null;
    }

    return normaliseHandle(decodeURIComponent(segments[0]));
  }

  function findHandleInElement(rootElement) {
    if (!rootElement || typeof rootElement.querySelectorAll !== "function") {
      return null;
    }

    const prioritySelectors = [
      '[data-testid="User-Name"] a[href]',
      '[data-testid="UserCell"] a[href]',
      'a[role="link"][href]'
    ];

    for (const selector of prioritySelectors) {
      for (const anchor of rootElement.querySelectorAll(selector)) {
        const handle = extractHandleFromHref(anchor.getAttribute("href"), location.href);

        if (handle) {
          return handle;
        }
      }
    }

    return null;
  }

  function findSelectableCard(target) {
    if (!target || typeof target.closest !== "function") {
      return null;
    }

    return target.closest(
      'article[data-testid="tweet"], [data-testid="UserCell"]'
    );
  }

  return Object.freeze({
    extractHandleFromHref,
    findHandleInElement,
    findSelectableCard,
    normaliseHandle
  });
});
