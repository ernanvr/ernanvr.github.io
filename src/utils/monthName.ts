import { getLangTag, type Locale } from "@i18n/utils";

// ponytail: single source of truth for month names. Builds a Date once per call;
// for the archives page that's at most 12 calls/year — fine.
const monthName = (locale: Locale, month: number): string =>
  new Intl.DateTimeFormat(getLangTag(locale), { month: "long" }).format(
    new Date(2024, month - 1, 1)
  );

export default monthName;
