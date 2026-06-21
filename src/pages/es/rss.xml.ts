import rss from "@astrojs/rss";
import { getSortedPostsByLocale } from "@utils/posts";
import { getPostSlug } from "@utils/slugify";
import { SITE } from "@config";

export async function GET() {
  const sortedPosts = await getSortedPostsByLocale("es");
  return rss({
    title: `${SITE.title} - Espanol LATAM`,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, id }) => ({
      link: `es/posts/${getPostSlug(id)}/`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
