import type { CollectionEntry } from "astro:content";
import { slugifyAll } from "./slugify";

const buildTagPostsMap = (
  posts: CollectionEntry<"blog">[]
): Map<string, CollectionEntry<"blog">[]> => {
  const map = new Map<string, CollectionEntry<"blog">[]>();
  for (const post of posts) {
    for (const slug of slugifyAll(post.data.tags)) {
      const bucket = map.get(slug);
      if (bucket) bucket.push(post);
      else map.set(slug, [post]);
    }
  }
  return map;
};

export default buildTagPostsMap;
