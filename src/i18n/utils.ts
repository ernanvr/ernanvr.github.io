export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_INFO: Record<
  Locale,
  {
    code: string;
    langTag: string;
    hreflang: string;
  }
> = {
  en: {
    code: "EN",
    langTag: "en-US",
    hreflang: "en-US",
  },
  es: {
    code: "ES",
    langTag: "es-419",
    hreflang: "es-419",
  },
};

type NamedRoute =
  | "home"
  | "posts"
  | "tags"
  | "about"
  | "now"
  | "uses"
  | "archives"
  | "search"
  | "rss";

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
} as const;

const POST_SLUG_SUFFIX: Record<Locale, string> = {
  en: "",
  es: "-es",
};

export const getLocaleFromPath = (pathname: string): Locale => {
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    return "es";
  }
  return "en";
};

export const stripLocaleFromPath = (pathname: string): string => {
  if (pathname === "/es") return "/";
  if (pathname.startsWith("/es/")) return pathname.slice(3);
  return pathname;
};

const getRouteKeyBySegment = (segment: string) => {
  if (!segment) return null;
  for (const [routeKey, value] of Object.entries(ROUTE_SEGMENTS)) {
    if (Object.values(value).some(routeSegment => routeSegment === segment)) {
      return routeKey as keyof typeof ROUTE_SEGMENTS;
    }
  }
  return null;
};

export const localizePath = (
  pathname: string,
  targetLocale: Locale,
  keepTrailingSlash = true
): string => {
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
      for (const locale of SUPPORTED_LOCALES) {
        const suffix = POST_SLUG_SUFFIX[locale];
        if (suffix && baseSlug.endsWith(suffix)) {
          baseSlug = baseSlug.slice(0, -suffix.length);
          break;
        }
      }

      const targetSuffix = POST_SLUG_SUFFIX[targetLocale];
      segments[1] = `${baseSlug}${targetSuffix}`;
    }
  }

  const rawPath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  const prefixedPath =
    targetLocale === "en" ? rawPath : `/${targetLocale}${rawPath}`;

  if (prefixedPath === "/") {
    return "/";
  }

  if (keepTrailingSlash && (hasTrailingSlash || !prefixedPath.includes("."))) {
    return `${prefixedPath.replace(/\/+$/, "")}/`;
  }

  return prefixedPath;
};

export const getLocalizedPath = (locale: Locale, route: NamedRoute): string => {
  const routeMap: Record<NamedRoute, string> = {
    home: "/",
    posts: "/posts/",
    tags: "/tags/",
    about: "/about/",
    now: "/now/",
    uses: "/uses/",
    archives: "/archives/",
    search: "/search/",
    rss: "/rss.xml",
  };

  return localizePath(routeMap[route], locale, route !== "rss");
};

export const getLangTag = (locale: Locale): string =>
  LOCALE_INFO[locale].langTag;

export const getHreflang = (locale: Locale): string =>
  LOCALE_INFO[locale].hreflang;
