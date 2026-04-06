## Exploration: language-switcher-404-bug

### Current State
`LanguageSwitcher.astro` builds locale links by calling `localizePath(Astro.url.pathname, locale)`. In `src/i18n/utils.ts`, `localizePath` not only swaps the `/es` prefix and localized route segments, it also rewrites blog post slugs using `POST_SLUG_SUFFIX`, turning English post slugs into `-es` slugs for Spanish.

The blog post routes in `src/pages/posts/[slug]/index.astro` and `src/pages/es/posts/[slug]/index.astro` do **not** use frontmatter `slug`. They generate paths from `getPostSlug(post.id)`, which strips the folder and extension and yields the same slug for both locales when filenames match.

For `one-moment-at-a-time`, the English and Spanish content files both live at `src/content/blog/{en,es}/one-moment-at-a-time.md`, so the generated route is the same slug in both locales.

### Affected Areas
- `src/components/LanguageSwitcher.astro` — uses `localizePath` to build the ES target URL.
- `src/i18n/utils.ts` — appends `-es` to post slugs when switching to Spanish.
- `src/pages/posts/[slug]/index.astro` — generates EN post routes from content entry IDs.
- `src/pages/es/posts/[slug]/index.astro` — generates ES post routes from content entry IDs.
- `src/content/blog/en/one-moment-at-a-time.md` / `src/content/blog/es/one-moment-at-a-time.md` — both versions exist under the same basename.
- `src/content.config.ts` — defines `slug` but the app does not currently consume it for routing.

### Approaches
1. **Stop mutating post slugs in `localizePath`** — keep the same slug and only switch locale prefix/route segment.
   - Pros: Matches the actual routes generated today; smallest fix.
   - Cons: No support for locale-specific slugs.
   - Effort: Low

2. **Make routing use frontmatter `slug` and a translation map** — generate locale-specific routes from content metadata.
   - Pros: Supports true localized slugs.
   - Cons: Requires refactoring route generation and cross-locale linking.
   - Effort: Medium/High

### Recommendation
Option 1 for this bug: remove the hardcoded `-es` post-slug rewrite (or otherwise make `localizePath` preserve the existing slug). The current site routes already expect the same slug in EN and ES, so the generated `-es` URL is the 404 source.

### Risks
- If any existing content link relies on `-es`, those URLs will change.
- The unused `slug` frontmatter may confuse future contributors until routing conventions are clarified.

### Ready for Proposal
Yes — the next step is a focused fix proposal for `localizePath` and a quick audit of blog links.
