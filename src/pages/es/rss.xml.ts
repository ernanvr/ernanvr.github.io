import rss from "@astrojs/rss";
import { getSortedPostsByLocale } from "@utils/posts";
import { getPostSlug } from "@utils/slugify";
import { SITE } from "@config";
import { getRssConfig } from "@utils/rssConfig";

export async function GET() {
  const locale = "es";
  const sortedPosts = await getSortedPostsByLocale(locale);
  const { title, linkPrefix } = getRssConfig(locale);

  return rss({
    title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, id }) => ({
      link: `${linkPrefix}${getPostSlug(id)}/`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
