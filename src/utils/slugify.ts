import kebabcase from "lodash.kebabcase";

export const slugifyStr = (str: string) => kebabcase(str);

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));

/**
 * Extracts a URL-friendly slug from a Content Collection entry id.
 * In Astro 5, entry ids include subdirectory and extension (e.g. "en/my-post.md").
 * This strips both to produce "my-post".
 */
export const getPostSlug = (id: string) =>
  id.replace(/^[^/]+\//, "").replace(/\.[^.]+$/, "");
