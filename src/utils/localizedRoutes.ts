import {
  getLocaleFromPath,
  localizePath,
  stripLocaleFromPath,
  type Locale,
} from "@i18n/utils";
import { getSortedPostsByLocale } from "@utils/posts";
import { getPostSlug } from "@utils/slugify";

/**
 * `localizePath()` swaps the locale prefix and translates a handful of route
 * segments, but it cannot know about per-content slugs: the same article is
 * `three-lessons-that-changed-my-life` in English and
 * `tres-lecciones-que-me-cambiaron-la-vida` in Spanish, so blindly localizing
 * a post URL yields a path that was never built — a 404.
 *
 * This resolves the candidate and validates it against the routes the site
 * actually generates. Returns null when the target locale has no version of
 * this page, which callers must treat as "do not advertise, do not redirect".
 *
 * Server-side only: it reads the content collections, so it must never be
 * imported from browser code (`@i18n/utils` is bundled for the client).
 *
 * KNOWN LIMITATION, stated rather than hidden: the check below validates that
 * A PATH EXISTS, not that it is the same article. Two locales sharing a slug
 * (`one-moment-at-a-time` is English-only; `un-momento-a-la-vez` Spanish-only)
 * are treated as unrelated, so those posts get no alternate link and no
 * auto-redirect — better than today's 404, but still unlinked. Truly pairing
 * them needs a declared relationship in the content (e.g. a `translation:`
 * frontmatter field), which is a content-model change and out of scope here.
 */

const POST_DETAIL = /^\/posts\/([^/]+)\/$/;

// Posts list includes archived entries on purpose: their URLs still resolve
// (see getPostDetailsStaticPaths), so they are valid redirect targets.
async function postExists(locale: Locale, slug: string): Promise<boolean> {
  const posts = await getSortedPostsByLocale(locale, {
    includeArchived: true,
  });
  return posts.some(post => getPostSlug(post.id) === slug);
}

export async function resolveLocalizedPath(
  pathname: string,
  targetLocale: Locale
): Promise<string | null> {
  const candidate = localizePath(pathname, targetLocale);
  const slug = stripLocaleFromPath(pathname).match(POST_DETAIL)?.[1];

  // Not a content-slug route: prefix swapping is correct here (/, /posts/,
  // /tags/, /archives/, /sobre-mi, ...).
  if (!slug) return candidate;

  if (getLocaleFromPath(pathname) === targetLocale) return candidate;

  return (await postExists(targetLocale, slug)) ? candidate : null;
}
