(() => {
  const STORAGE_KEY = "preferredLocale";
  const DEFAULT_LOCALE = "en";
  const BOT_UA_PATTERN =
    /bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i;
  const DEBUG_LANG_DETECTION = false;

  const ROUTE_SEGMENTS = {
    about: {
      en: "about",
      es: "sobre-mi",
    },
    now: {
      en: "now",
      es: "ahora",
    },
    uses: {
      en: "uses",
      es: "uso",
    },
  };

  const POST_SLUG_SUFFIX = {
    en: "",
    es: "-es",
  };

  const debugLog = (...args) => {
    if (DEBUG_LANG_DETECTION) {
      console.log("[detect-language]", ...args);
    }
  };

  const getStoredLocale = () => {
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

  const setStoredLocale = locale => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures.
    }
  };

  const isBotUserAgent = () => BOT_UA_PATTERN.test(navigator.userAgent);

  const detectBrowserLocale = () => {
    const preferredLanguage =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      DEFAULT_LOCALE;

    return preferredLanguage.toLowerCase().startsWith("es") ? "es" : "en";
  };

  const getCurrentLocaleFromPath = pathname => {
    if (pathname === "/es" || pathname.startsWith("/es/")) {
      return "es";
    }

    return "en";
  };

  const stripLocaleFromPath = pathname => {
    if (pathname === "/es") {
      return "/";
    }

    if (pathname.startsWith("/es/")) {
      return pathname.slice(3);
    }

    return pathname;
  };

  const getRouteKeyBySegment = segment => {
    if (!segment) {
      return null;
    }

    for (const [routeKey, value] of Object.entries(ROUTE_SEGMENTS)) {
      if (Object.values(value).some(routeSegment => routeSegment === segment)) {
        return routeKey;
      }
    }

    return null;
  };

  const localizePath = (pathname, targetLocale) => {
    const hasTrailingSlash = pathname.endsWith("/");
    const basePath = stripLocaleFromPath(pathname);
    const segments = basePath.split("/").filter(Boolean);

    if (segments.length > 0) {
      const routeKey = getRouteKeyBySegment(segments[0]);

      if (routeKey) {
        segments[0] = ROUTE_SEGMENTS[routeKey][targetLocale];
      }

      if (segments[0] === "posts" && segments[1]) {
        let baseSlug = segments[1];

        for (const suffix of Object.values(POST_SLUG_SUFFIX)) {
          if (suffix && baseSlug.endsWith(suffix)) {
            baseSlug = baseSlug.slice(0, -suffix.length);
            break;
          }
        }

        segments[1] = `${baseSlug}${POST_SLUG_SUFFIX[targetLocale]}`;
      }
    }

    const rawPath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
    const prefixedPath = targetLocale === "en" ? rawPath : `/es${rawPath}`;

    if (prefixedPath === "/") {
      return "/";
    }

    if (hasTrailingSlash || !prefixedPath.includes(".")) {
      return `${prefixedPath.replace(/\/+$/, "")}/`;
    }

    return prefixedPath;
  };

  const updatePreferenceFromLanguageSwitcher = event => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const localeLink = event.target.closest(".locale-link");

    if (!(localeLink instanceof HTMLAnchorElement)) {
      return;
    }

    const href = localeLink.getAttribute("href") || "";
    const targetLocale =
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
    const currentLocale = getCurrentLocaleFromPath(currentPath);
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
})();
