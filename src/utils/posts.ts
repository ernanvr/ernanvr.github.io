import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import postFilter, { isPublishable } from "./postFilter";
import getSortedPosts from "./getSortedPosts";
import getUniqueTags from "./getUniqueTags";
import type { Locale } from "@i18n/utils";

const cache = new Map<Locale, Promise<CollectionEntry<"blog">[]>>();
const sortedCache = new Map<Locale, CollectionEntry<"blog">[]>();
const feedCache = new Map<Locale, CollectionEntry<"blog">[]>();
const tagsCache = new Map<Locale, { tag: string; tagName: string }[]>();

const fetchPosts = (locale: Locale): Promise<CollectionEntry<"blog">[]> =>
  getCollection(
    "blog",
    entry => isPublishable(entry) && entry.data.lang === locale
  );

/** Every publishable post for a locale, archived ones included. */
export const getAllPosts = (
  locale: Locale
): Promise<CollectionEntry<"blog">[]> => {
  if (!cache.has(locale)) {
    cache.set(locale, fetchPosts(locale));
  }
  return cache.get(locale)!;
};

/** Sorted publishable posts, archived ones included. Used for detail pages. */
export const getAllSortedPostsByLocale = async (
  locale: Locale
): Promise<CollectionEntry<"blog">[]> => {
  if (!sortedCache.has(locale)) {
    sortedCache.set(locale, getSortedPosts(await getAllPosts(locale)));
  }
  return sortedCache.get(locale)!;
};

/** Sorted posts of the normal feed: archived posts are excluded. */
export const getSortedPostsByLocale = async (
  locale: Locale
): Promise<CollectionEntry<"blog">[]> => {
  if (!feedCache.has(locale)) {
    feedCache.set(
      locale,
      (await getAllSortedPostsByLocale(locale)).filter(postFilter)
    );
  }
  return feedCache.get(locale)!;
};

export const getUniqueTagsByLocale = async (
  locale: Locale
): Promise<{ tag: string; tagName: string }[]> => {
  if (!tagsCache.has(locale)) {
    tagsCache.set(locale, getUniqueTags(await getSortedPostsByLocale(locale)));
  }
  return tagsCache.get(locale)!;
};
