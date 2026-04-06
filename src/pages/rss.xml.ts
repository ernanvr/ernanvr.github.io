import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import getSortedPosts from "@utils/getSortedPosts";
import { getPostSlug } from "@utils/slugify";
import { SITE } from "@config";

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => data.lang === "en");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, id }) => ({
      link: `posts/${getPostSlug(id)}/`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
