import { slugifyStr } from "./slugify";
import type { CollectionEntry } from "astro:content";

interface Tag {
  tag: string;
  tagName: string;
}

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  const seen = new Set<string>();
  const tags: Tag[] = [];
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugifyStr(tag);
      if (!seen.has(slug)) {
        seen.add(slug);
        tags.push({ tag: slug, tagName: tag });
      }
    }
  }
  return tags.sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
};

export default getUniqueTags;
