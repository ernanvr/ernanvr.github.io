import {
  DEFAULT_LOCALE,
  LOCALE_INFO,
  getLocaleFromPath,
  type Locale,
} from "@i18n/utils";

const STORAGE_KEY = "preferredLocale";
const BOT_UA_PATTERN =
  /bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i;
const DEBUG_LANG_DETECTION = false;

declare global {
  interface Window {
    __preferredLocaleListenerBound?: boolean;
  }
}

const debugLog = (...args: unknown[]) => {
  if (DEBUG_LANG_DETECTION) {
    console.log("[detect-language]", ...args);
  }
};

const getStoredLocale = (): Locale | null => {
  try {
    const locale = localStorage.getItem(STORAGE_KEY);
    if (locale === "en" || locale === "es") {
      return locale;
    }
  } catch {
    return null;
  }

  return null;
};

const setStoredLocale = (locale: Locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures.
  }
};

const isBotUserAgent = () => BOT_UA_PATTERN.test(navigator.userAgent);

// The server already knows which localized versions of this page exist and has
// published them as <link rel="alternate" hreflang=...>. Reading that is the
// whole point: the browser used to rebuild the path itself with localizePath(),
// which cannot know per-post slugs (`three-lessons-...` vs
// `tres-lecciones-...`) and therefore redirected first-time visitors to 404s.
// One source of truth, on the side that has the data.
const localizedHrefFor = (locale: Locale): string | null => {
  const link = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${LOCALE_INFO[locale].hreflang}"]`
  );
  const href = link?.href;
  if (!href) return null;

  try {
    const target = new URL(href, window.location.origin);

    // hreflang hrefs are absolute against astro.config's `site`, so their host
    // is the production domain even when this page is served from a preview
    // deploy or localhost — a plain origin comparison would silently kill every
    // redirect outside production. The document's own canonical URL names the
    // site that published this page, so it is the correct thing to accept,
    // while still refusing an alternate pointing at somebody else's host.
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    )?.href;
    const ownHosts = new Set([
      window.location.host,
      ...(canonical ? [new URL(canonical).host] : []),
    ]);
    if (!ownHosts.has(target.host)) return null;

    return target.pathname;
  } catch {
    return null;
  }
};

const detectBrowserLocale = (): Locale => {
  const preferredLanguage =
    navigator.languages[0] ?? navigator.language ?? DEFAULT_LOCALE;

  return preferredLanguage.toLowerCase().startsWith("es") ? "es" : "en";
};

const updatePreferenceFromLanguageSwitcher = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  // Match on the switcher wrapper, not the link's own class: the inner markup
  // has already been redesigned once (.locale-link -> .locale-item) and this
  // handler silently stopped firing. .locale-switcher survived that redesign.
  const localeLink = target.closest(".locale-switcher a");
  if (!(localeLink instanceof HTMLAnchorElement)) {
    return;
  }

  const targetLocale = getLocaleFromPath(localeLink.getAttribute("href") || "");

  setStoredLocale(targetLocale);
  debugLog("Stored locale from language switcher:", targetLocale);
};

const runFirstVisitDetection = () => {
  if (isBotUserAgent()) {
    debugLog("Bot user-agent detected. Skipping language detection.");
    return;
  }

  const storedLocale = getStoredLocale();
  if (storedLocale) {
    debugLog("Stored locale found:", storedLocale);
    return;
  }

  const currentPath = window.location.pathname;
  const currentLocale = getLocaleFromPath(currentPath);
  const detectedLocale = detectBrowserLocale();

  debugLog("Current locale:", currentLocale);
  debugLog("Detected locale:", detectedLocale);

  if (detectedLocale !== currentLocale) {
    const targetPath = localizedHrefFor(detectedLocale);

    if (targetPath && targetPath !== currentPath) {
      const redirectUrl = `${targetPath}${window.location.search}${window.location.hash}`;

      setStoredLocale(detectedLocale);
      window.location.replace(redirectUrl);
      return;
    }

    // This page has no version in the visitor's language. Deliberately store
    // NOTHING: saving the *current* locale would pin them to a language they
    // never picked and suppress the redirect on pages that do have a
    // translation. Leaving it unset simply tries again next page.
    debugLog("No alternate available for", detectedLocale);
    return;
  }

  setStoredLocale(currentLocale);
};

try {
  runFirstVisitDetection();

  if (!window.__preferredLocaleListenerBound) {
    document.addEventListener("click", updatePreferenceFromLanguageSwitcher);
    window.__preferredLocaleListenerBound = true;
  }
} catch {
  // Fail silently on non-critical runtime issues.
}
