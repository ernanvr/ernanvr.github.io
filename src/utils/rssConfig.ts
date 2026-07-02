import { SITE } from "@config";
import type { Locale } from "@i18n/utils";

export function getRssConfig(locale: Locale) {
  const isSpanish = locale === "es";

  return {
    title: isSpanish ? `${SITE.title} - Espanol LATAM` : SITE.title,
    linkPrefix: isSpanish ? "es/posts/" : "posts/",
  };
}
