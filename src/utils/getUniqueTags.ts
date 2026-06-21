import { slugifyStr } from "./slugify";
import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";

interface Tag {
  tag: string;
  tagName: string;
}

const getUniqueTags = (
  posts: CollectionEntry<"blog">[],
  skipPostFilter?: boolean
) => {
  const seen = new Set<string>();
  const tags: Tag[] = [];
  const filtered = skipPostFilter ? posts : posts.filter(postFilter);
  for (const post of filtered) {
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
