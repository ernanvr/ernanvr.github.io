import {
  SUPPORTED_LOCALES,
  getLocaleFromPath,
  localizePath,
  stripLocaleFromPath,
  type Locale,
} from "@i18n/utils";
import { getSortedPostsByLocale } from "@utils/posts";
import { getPostSlug } from "@utils/slugify";

/**
 * `localizePath()` swaps the locale prefix and translates a few route
 * segments, but it cannot know per-content slugs: one article is
 * `three-lessons-that-changed-my-life` in English and
 * `tres-lecciones-que-me-cambiaron-la-vida` in Spanish. Building a localized
 * URL out of the current one therefore yields a path that was never generated.
 *
 * The pairing is read from each post's `translation` frontmatter field, so this
 * resolves identity and not mere existence: it will only claim two pages are
 * the same article when the content says so.
 *
 * Still validates existence afterwards, because a mistyped or stale
 * `translation:` value would otherwise recreate exactly the bug this module
 * exists to fix. An unresolvable pair returns null and callers must treat null
 * as "do not link, do not redirect".
 *
 * Server-side only: it reads the content collections, so it must never be
 * imported from browser code (`@i18n/utils` is bundled for the client).
 */

const POST_DETAIL = /^\/posts\/([^/]+)\/$/;

type Table = {
  /** `locale/slug` -> slug of the same article in the other locale */
  pairs: Map<string, string>;
  /** slugs that actually get built, per locale */
  built: Record<Locale, Set<string>>;
};

let table: Promise<Table> | null = null;

const otherOf = (locale: Locale): Locale =>
  (locale === "en" ? "es" : "en") as Locale;

async function buildTable(): Promise<Table> {
  const pairs = new Map<string, string>();
  const built = Object.fromEntries(
    SUPPORTED_LOCALES.map(locale => [locale, new Set<string>()])
  ) as Record<Locale, Set<string>>;

  for (const locale of SUPPORTED_LOCALES) {
    // Archived posts included: their URLs still resolve (see
    // getPostDetailsStaticPaths), so they are valid link/redirect targets.
    const posts = await getSortedPostsByLocale(locale, {
      includeArchived: true,
    });
    for (const post of posts) {
      const slug = getPostSlug(post.id);
      built[locale].add(slug);

      const counterpart = post.data.translation;
      if (!counterpart) continue;

      const key = `${locale}/${slug}`;
      const reverse = `${otherOf(locale)}/${counterpart}`;
      // Declaring one direction is enough; mirror it so both pages can find
      // each other even if only one of the two files was updated.
      if (!pairs.has(key)) pairs.set(key, counterpart);
      if (!pairs.has(reverse)) pairs.set(reverse, slug);
    }
  }

  return { pairs, built };
}

function tableOnce(): Promise<Table> {
  if (!table) table = buildTable();
  return table;
}

/**
 * The localized URL for `pathname`, or null when the target locale has no
 * version of that page.
 */
export async function resolveLocalizedPath(
  pathname: string,
  targetLocale: Locale
): Promise<string | null> {
  const candidate = localizePath(pathname, targetLocale);
  const slug = stripLocaleFromPath(pathname).match(POST_DETAIL)?.[1];

  // Not a content-slug route: swapping the prefix is correct here (/, /posts/,
  // /tags/, /archives/, /sobre-mi, ...).
  if (!slug) return candidate;

  const currentLocale = getLocaleFromPath(pathname);
  if (currentLocale === targetLocale) return candidate;

  const { pairs, built } = await tableOnce();
  const counterpart = pairs.get(`${currentLocale}/${slug}`);

  // Either the article declares no translation, or this is not a page we build
  // in the current locale at all.
  if (!counterpart) return null;

  // The declared value must still point at something that gets built.
  if (!built[targetLocale]?.has(counterpart)) return null;

  return localizePath(`/posts/${counterpart}/`, targetLocale);
}
