import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";
import getSortedPosts from "./getSortedPosts";
import getUniqueTags from "./getUniqueTags";
import type { Locale } from "@i18n/utils";

export interface GetPostsOptions {
  /** Include posts marked as `archived: true`. Defaults to false. */
  includeArchived?: boolean;
}

const cache = new Map<Locale, Promise<CollectionEntry<"blog">[]>>();
const sortedCache = new Map<string, CollectionEntry<"blog">[]>();
const tagsCache = new Map<Locale, { tag: string; tagName: string }[]>();

const fetchPosts = (locale: Locale): Promise<CollectionEntry<"blog">[]> =>
  getCollection(
    "blog",
    entry => postFilter(entry) && entry.data.lang === locale
  );

export const getAllPosts = (
  locale: Locale
): Promise<CollectionEntry<"blog">[]> => {
  if (!cache.has(locale)) {
    cache.set(locale, fetchPosts(locale));
  }
  return cache.get(locale)!;
};

export const getSortedPostsByLocale = async (
  locale: Locale,
  { includeArchived = false }: GetPostsOptions = {}
): Promise<CollectionEntry<"blog">[]> => {
  const cacheKey = `${locale}:${includeArchived ? "all" : "live"}`;
  if (!sortedCache.has(cacheKey)) {
    const posts = await getAllPosts(locale);
    const visiblePosts = includeArchived
      ? posts
      : posts.filter(post => !post.data.archived);
    sortedCache.set(cacheKey, getSortedPosts(visiblePosts));
  }
  return sortedCache.get(cacheKey)!;
};

export const getUniqueTagsByLocale = async (
  locale: Locale
): Promise<{ tag: string; tagName: string }[]> => {
  if (!tagsCache.has(locale)) {
    // Only tags from non-archived posts, so the tag cloud matches tag pages
    const livePosts = await getSortedPostsByLocale(locale);
    tagsCache.set(locale, getUniqueTags(livePosts));
  }
  return tagsCache.get(locale)!;
};
