import type { CollectionEntry } from "astro:content";

const getTime = (post: CollectionEntry<"blog">) =>
  Math.floor(
    new Date(post.data.modDatetime ?? post.data.pubDatetime).getTime() / 1000
  );

const getSortedPosts = (posts: CollectionEntry<"blog">[]) =>
  [...posts].sort((a, b) => getTime(b) - getTime(a));

export default getSortedPosts;
