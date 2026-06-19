# AstroPaper Multilingual Blog — Optimization Analysis

**Project:** `/Users/ernanvr/Projects/ernanvr.github.io`  
**Scope:** Read-only review of build/runtime performance, hydration, i18n, image/OG generation, and DRY violations.  
**Current content scale:** 4 posts (2 `en`, 2 `es`), 1 empty `es-es/` directory.

---

## Summary

The highest-value fixes are all low-to-medium effort: **caching Google Fonts during OG image generation**, **deferring hydration of the search page**, **fixing the OG image slug mismatch**, and **deduplicating the collection pipeline**. The codebase is small enough that most build-time costs are invisible today, but the patterns scale poorly and several correctness bugs exist.

| Rank | Finding | Impact | Effort | Impact/Effort |
|------|---------|--------|--------|---------------|
| 1 | Google Fonts re-fetched for every OG image (`loadGoogleFont.ts`) | High | Low/Med | ⭐ Highest |
| 2 | Search page hydrates immediately and ships Fuse.js (`Search.tsx` + `search.astro`) | High | Low | ⭐ Highest |
| 3 | OG image route slug mismatches post URL (`index.png.ts` vs `[slug]/index.astro`) | High | Low | ⭐ Highest |
| 4 | Duplicate `en` / `es` page pairs (index, archives, tags, posts, rss, search) | High | High | High |
| 5 | Missing image optimization / sharp service | High | Med | High |
| 6 | `searchList` serializes entire post frontmatter to the client | Med | Low | High |
| 7 | `getUniqueTags` deduplicates tags with O(n²) `findIndex` | Med | Low | High |
| 8 | No prefetch configuration | Med | Low | High |
| 9 | Collection queries, filtering, and sorting repeated per route | Med | Med | Medium |
| 10 | Duplicate i18n path logic between server and client | High | Med | Medium |
| 11 | Archives pages duplicate month maps and inline sorting | Low/Med | Low | Medium |
| 12 | `Date` allocations inside sort comparator | Low | Low | Medium |
| 13 | Tailwind scans unused file extensions | Low | Low | Low |
| 14 | Empty `es-es/` content directory | Low | Low | Low |
| 15 | Inactive social placeholders in config | Low | Low | Low |

---

## 1. Performance / Build Optimizations

### 1.1 Google Fonts re-fetched for every OG image

- **Location:** `src/utils/loadGoogleFont.ts:8-36`, called from `src/utils/og-templates/post.tsx:95-97` and `src/utils/og-templates/site.tsx:87-89`
- **Problem:** `loadGoogleFonts` fetches two IBM Plex Mono font files from Google Fonts for every generated image. With N posts this produces ~2N network requests during the build. The text payload differs per post (`post.data.title + post.data.author + SITE.title + "by"`), so even HTTP caching is unlikely to help. The build is therefore slow, flaky, and dependent on external network availability.
- **Impact:** Build time / reliability — **High**
- **Suggested fix:**
  1. Download the needed font files once at build start (e.g., in a Vite plugin or a memoized loader).
  2. Cache the `ArrayBuffer` in module scope / a `WeakMap` keyed by font config so all OG images share it.
  3. Optionally vendor the fonts into `public/fonts/` and load from disk to eliminate network calls entirely.
- **Effort:** Low/Med

### 1.2 Collection queries, filtering, and sorting repeated across routes

- **Location:** `src/pages/posts/[...page].astro:9-12`, `src/pages/es/posts/[...page].astro:9-12`, `src/pages/tags/[tag]/[...page].astro:10-12`, `src/pages/es/tags/[tag]/[...page].astro:10-12`, `src/pages/search.astro:14-18`, `src/pages/es/search.astro:14-18`, `src/pages/archives/index.astro:15-18`, `src/pages/es/archives/index.astro:15-18`, `src/pages/rss.xml.ts:9-10`, `src/pages/es/rss.xml.ts:9-10`, `src/pages/posts/[slug]/index.astro:13-14,25-27`, `src/pages/es/posts/[slug]/index.astro:13-14,25-27`
- **Problem:** Every route independently calls `getCollection("blog", ...)` and runs `getSortedPosts`. Astro may cache the raw collection, but filtering by `lang` + `draft` + scheduled-time and sorting by date is recomputed for every page. At 4 posts this is free; at 100+ posts it multiplies build work by the number of routes.
- **Impact:** Build time — **Medium** (currently low due to small scale)
- **Suggested fix:** Create a single data module (e.g., `src/utils/posts.ts`) that exposes:

  ```ts
  export const getAllPosts = (locale: Locale) => getCollection("blog", ...);
  export const getSortedPostsByLocale = (locale: Locale) => ...;
  export const getUniqueTagsByLocale = (locale: Locale) => ...;
  ```

  Use module-level memoization so repeated calls in the same build return the same array.
- **Effort:** Medium

### 1.3 `getUniqueTags` deduplicates with O(n²) `findIndex`

- **Location:** `src/utils/getUniqueTags.ts:14-18`
- **Problem:** After flattening tags, uniqueness is enforced with `.filter((value, index, self) => self.findIndex(tag => tag.tag === value.tag) === index)`. For T total tag occurrences this is O(T²).
- **Impact:** Build time — **Medium**
- **Suggested fix:** Replace with a `Map` or `Set`:

  ```ts
  const seen = new Set<string>();
  const tags: Tag[] = [];
  for (const post of posts.filter(postFilter)) {
    for (const tag of post.data.tags) {
      const slug = slugifyStr(tag);
      if (!seen.has(slug)) {
        seen.add(slug);
        tags.push({ tag: slug, tagName: tag });
      }
    }
  }
  return tags.sort((a, b) => a.tag.localeCompare(b.tag));
  ```

- **Effort:** Low

### 1.4 Tag routes re-filter and re-sort posts per tag

- **Location:** `src/pages/tags/[tag]/[...page].astro:10-18` and `src/pages/es/tags/[tag]/[...page].astro:10-18`
- **Problem:** `getUniqueTags(posts)` filters and sorts all tags. Then for each tag, `getPostsByTag(posts, tag)` calls `getSortedPosts`, which re-filters drafts and re-sorts the full post list. The full collection is therefore filtered and sorted once per unique tag.
- **Impact:** Build time — **Medium**
- **Suggested fix:** Pre-compute the sorted, published post list once, then build a single `Map<slugifiedTag, posts[]>` by iterating posts once.
- **Effort:** Medium

### 1.5 `Date` allocations inside sort comparator

- **Location:** `src/utils/getSortedPosts.ts:5-12`
- **Problem:** The comparator creates two `new Date(...)` objects on every comparison. Sorting n posts performs O(n log n) comparisons, causing many redundant `Date` allocations.
- **Impact:** Build time — **Low**
- **Suggested fix:** Pre-compute a `timestamp` for each post before sorting:

  ```ts
  const getTime = (post) =>
    Math.floor(new Date(post.data.modDatetime ?? post.data.pubDatetime).getTime() / 1000);
  return posts.filter(postFilter).sort((a, b) => getTime(b) - getTime(a));
  ```

  (The compiler may or may not inline; an explicit map+sort is clearer.)
- **Effort:** Low

### 1.6 Archives pages re-sort each month group

- **Location:** `src/pages/archives/index.astro:66-73` and `src/pages/es/archives/index.astro:66-73`
- **Problem:** Posts are grouped by year and month, then each month group is sorted independently with duplicated date math.
- **Impact:** Build time — **Low**
- **Suggested fix:** Sort the full filtered list once before grouping, then use a stable grouping utility that preserves order. Alternatively use `getSortedPosts(posts)` and then group.
- **Effort:** Low

---

## 2. Client-Side JS / Hydration

### 2.1 Search page hydrates immediately with a heavy React + Fuse.js bundle

- **Location:** `src/pages/search.astro:40` (`client:load`), `src/components/Search.tsx:1`
- **Problem:** The search page uses `client:load`, so React, React DOM, and `fuse.js` are downloaded and executed as soon as the page loads. `fuse.js` is a capable fuzzy searcher but adds ~25 kB+ gzipped for what is essentially a small static list.
- **Impact:** Bundle size / runtime — **High**
- **Suggested fix:**
  - **Quick win:** Change `client:load` to `client:visible` or `client:idle`.
  - **Better:** Replace `fuse.js` with a lighter client-side fuzzy matcher (e.g., `fzf`, `uFuzzy`, or a custom ~100-line implementation) for this small dataset.
  - **Best:** Generate a pre-built search index at build time and ship only that JSON plus a tiny searcher, or convert the search UI to a vanilla JS island and remove React from the search page entirely.
- **Effort:** Low (directive) to Medium (rewrite)

### 2.2 `SearchItem` serializes the entire post frontmatter into island props

- **Location:** `src/components/Search.tsx:12-16`, `src/pages/search.astro:19-24`, `src/pages/es/search.astro:19-24`
- **Problem:** The `data` field passed to the search island contains the full `CollectionEntry<"blog">["data"]` object. This bloats the inline JSON embedded in the HTML and increases the hydrated state.
- **Impact:** HTML size / hydration cost — **Medium**
- **Suggested fix:** Only pass fields the `Card` component needs (e.g., `title`, `description`, `pubDatetime`, `modDatetime`, `tags`, `featured`, `slug`).
- **Effort:** Low

### 2.3 Card/Datetime are React components but never hydrated

- **Location:** `src/components/Card.tsx`, `src/components/Datetime.tsx`
- **Problem:** These components are imported and used in `.astro` files without any `client:*` directive, so they are server-rendered only. Keeping them as `.tsx` files means the project still depends on `@astrojs/react` and the React build pipeline for purely static markup.
- **Impact:** Maintainability / build complexity — **Low/Medium**
- **Suggested fix:** Convert `Card` and `Datetime` to Astro components. This removes React from all list pages and leaves it only for the search island.
- **Effort:** Medium

---

## 3. i18n Utility Correctness & Cost

### 3.1 Duplicate i18n path logic between server and client

- **Location:** `src/i18n/utils.ts:19-24,35-78` and `public/detect-language.js:14-104`
- **Problem:** `ROUTE_SEGMENTS`, `stripLocaleFromPath`, `getRouteKeyBySegment`, and `localizePath` are implemented twice, in slightly different ways. The client script additionally handles `POST_SLUG_SUFFIX` logic that the server utility does not. Any routing change must be edited in two places, creating a high risk of drift.
- **Impact:** Maintainability / correctness — **High**
- **Suggested fix:**
  1. Move the routing table to a shared isomorphic module.
  2. Generate `detect-language.js` from that module at build time, or inject the serialized routing table into the client script.
  3. Ensure server `localizePath` handles post slug suffixes the same way the client does.
- **Effort:** Medium

### 3.2 `useTranslations` returns a new closure on every call

- **Location:** `src/i18n/ui.ts:75-77`
- **Problem:** Each Astro/React component call creates a fresh translator function. At build time this is cheap; at runtime for hydrated components it is unnecessary allocation.
- **Impact:** Runtime — **Low**
- **Suggested fix:** Export pre-bound translators or memoize by locale.
- **Effort:** Low

---

## 4. Astro / SSG Config

### 4.1 No image optimization service configured

- **Location:** `astro.config.ts`
- **Problem:** The project does not install or configure an image service. Content images (e.g., `ogImage` frontmatter, hero images) and public assets are served as-is. There is no responsive sizing, WebP/AVIF conversion, or lazy loading.
- **Impact:** Runtime performance / Lighthouse — **High**
- **Suggested fix:**
  1. Add `sharp` as a dependency (Astro 5 defaults to it when present).
  2. Use `astro:assets` `<Image />` and `<Picture />` components for content images.
  3. Configure remote image patterns if external OG images are used.
- **Effort:** Medium

### 4.2 No prefetch configuration

- **Location:** `astro.config.ts`
- **Problem:** Astro 5 supports link prefetching out of the box, but it is not enabled.
- **Impact:** Runtime perceived performance — **Medium**
- **Suggested fix:** Add `prefetch: true` or `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }` to `defineConfig`.
- **Effort:** Low

### 4.3 Tailwind v4 uses CSS-based configuration (no config file)

- **Location:** (formerly `tailwind.config.cjs`, now deleted)
- **Problem:** The project has migrated to Tailwind v4 which uses CSS-based configuration via `@tailwind` directives. Content scanning is automatic based on module resolution — no manual `content` array is needed. The old `content` glob from the deleted config file is no longer relevant.
- **Impact:** Build time — **Low** (improved from the old setup)
- **Suggested fix:** No action needed — Tailwind v4 handles content detection automatically.
- **Effort:** N/A

### 4.4 Google Fonts loaded via preload-as-style hack without `display=swap`

- **Location:** `src/layouts/Layout.astro:95-101`
- **Problem:** The stylesheet link uses `rel="preload" as="style" onload="this.rel='stylesheet'"`. This can still block first paint and does not include `&display=swap`, risking invisible text during load.
- **Impact:** Runtime — **Medium**
- **Suggested fix:**
  - Add `&display=swap` to the font URL.
  - Better: self-host a subset of IBM Plex Mono and Merriweather, or use `font-display: swap` explicitly.
- **Effort:** Low

---

## 5. Image & OG Generation

### 5.1 OG image route param does not match post URL slug

- **Location:** `src/pages/posts/[slug]/index.png.ts:9-14`
- **Problem:** The OG route param is built with `slugifyStr(post.data.title)`, but the post detail page uses `getPostSlug(post.id)` (`src/pages/posts/[slug]/index.astro:18` and `src/layouts/PostDetails.astro:35`). If a post's filename/`slug` frontmatter differs from its title, the OG image path generated in `PostDetails.astro` (`/posts/${slugifyStr(title)}.png`) will 404 because no route exists for that slug.
- **Impact:** Correctness / SEO — **High**
- **Suggested fix:** Use `getPostSlug(post.id)` consistently for both the post route and the OG image route:

  ```ts
  params: { slug: getPostSlug(post.id) },
  ```

- **Effort:** Low

### 5.2 Site OG image re-fetches fonts on every build invocation

- **Location:** `src/pages/og.png.ts:5-7`, `src/utils/generateOgImages.tsx:12-14`
- **Problem:** In static builds this endpoint is rendered once, but `generateOgImageForSite` still calls `loadGoogleFonts` and downloads font files. The same font caching fix as Finding 1.1 applies.
- **Impact:** Build time / reliability — **Medium**
- **Suggested fix:** Share a cached font loader between site and post OG generators.
- **Effort:** Low

---

## 6. Code Quality / DRY

### 6.1 Near-duplicate `en` / `es` page pairs

- **Location:**
  - `src/pages/index.astro` ↔ `src/pages/es/index.astro`
  - `src/pages/archives/index.astro` ↔ `src/pages/es/archives/index.astro`
  - `src/pages/tags/index.astro` ↔ `src/pages/es/tags/index.astro`
  - `src/pages/posts/[...page].astro` ↔ `src/pages/es/posts/[...page].astro`
  - `src/pages/posts/[slug]/index.astro` ↔ `src/pages/es/posts/[slug]/index.astro`
  - `src/pages/tags/[tag]/[...page].astro` ↔ `src/pages/es/tags/[tag]/[...page].astro`
  - `src/pages/search.astro` ↔ `src/pages/es/search.astro`
  - `src/pages/rss.xml.ts` ↔ `src/pages/es/rss.xml.ts`
- **Problem:** Every route is duplicated with only locale strings and filters changed. This doubles the surface area for bugs and makes updates error-prone.
- **Impact:** Maintainability — **High**
- **Suggested fix:**
  - Adopt Astro's built-in i18n routing (`i18n.locales`, `i18n.defaultLocale`, `i18n.routing`) so `[locale]/...` routes generate both languages.
  - Alternatively refactor each duplicated pair into a single parameterized route (e.g., `src/pages/[locale]/index.astro`) or shared layout that derives `locale` from the URL.
- **Effort:** High

### 6.2 Month-name maps duplicated per locale

- **Location:** `src/pages/archives/index.astro:22-34` and `src/pages/es/archives/index.astro:22-34`
- **Problem:** Hardcoded English and Spanish month maps live in two separate files. This is exactly what `Intl.DateTimeFormat` is designed for.
- **Impact:** Maintainability — **Low/Medium**
- **Suggested fix:** Replace the maps with `new Intl.DateTimeFormat(locale, { month: 'long' }).format(monthIndexDate)` inside a shared archives utility.
- **Effort:** Low

### 6.3 `getPostsByGroupCondition` exposes unused index parameter

- **Location:** `src/utils/getPostsByGroupCondition.ts:12-13`
- **Problem:** `groupFunction(item, i)` passes `index` but no caller uses it.
- **Impact:** Maintainability — **Low**
- **Suggested fix:** Remove the index parameter to simplify the signature.
- **Effort:** Low

### 6.4 Empty `es-es/` content directory

- **Location:** `src/content/blog/es-es/`
- **Problem:** The directory exists but contains no files. It is not referenced by any locale utility and may confuse content collection scanning.
- **Impact:** Maintainability — **Low**
- **Suggested fix:** Delete the empty directory.
- **Effort:** Low

### 6.5 Inactive social placeholders with misleading URLs

- **Location:** `src/config.ts:25-140`
- **Problem:** Many `SOCIALS` entries are `active: false` and point to `https://github.com/satnaing/astro-paper` (the upstream theme repo). They are filtered out at runtime but pollute the config.
- **Impact:** Maintainability — **Low**
- **Suggested fix:** Remove inactive entries or keep only active ones.
- **Effort:** Low

### 6.6 Redundant `LOCALE` object in config

- **Location:** `src/config.ts:18-21`
- **Problem:** `LOCALE.langTag: ["en-US", "es-419""]` duplicates the per-locale metadata already defined in `src/i18n/utils.ts:LOCALE_INFO`.
- **Impact:** Maintainability — **Low**
- **Suggested fix:** Remove `LOCALE` from `config.ts` and consume `LOCALE_INFO` everywhere.
- **Effort:** Low

---

## Recommended Order of Attack

1. **Fix OG font caching** — biggest build-time win, simple module-level memoization.
2. **Fix OG slug mismatch** — correctness bug, one-line change.
3. **Switch search to `client:visible` or `client:idle`** — immediate bundle/JS win.
4. **Trim `searchList` props** — reduce HTML bloat, low effort.
5. **Fix `getUniqueTags` O(n²)** and **archives sorting** — small, safe build wins.
6. **Enable prefetch** and **add `display=swap`** — quick runtime wins.
7. **Install `sharp` / configure image service** — significant Lighthouse improvement.
8. **Centralize post/tag data** — reduces repeated work as content grows.
9. **Deduplicate i18n routing logic** between server and client.
10. **Refactor to parameterized `[locale]` routes** — largest maintainability improvement, but highest effort; defer until after quick wins.
