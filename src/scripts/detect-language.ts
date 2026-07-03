import {
  DEFAULT_LOCALE,
  getLocaleFromPath,
  localizePath,
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

  const localeLink = target.closest(".locale-link");
  if (!(localeLink instanceof HTMLAnchorElement)) {
    return;
  }

  const href = localeLink.getAttribute("href") || "";
  const targetLocale: Locale =
    href === "/es" || href.startsWith("/es/") ? "es" : "en";

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
    const redirectPath = localizePath(currentPath, detectedLocale);
    const redirectUrl = `${redirectPath}${window.location.search}${window.location.hash}`;

    setStoredLocale(detectedLocale);
    window.location.replace(redirectUrl);
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
