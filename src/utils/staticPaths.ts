import { SITE } from "@config";
import type { Locale } from "@i18n/utils";
import buildTagPostsMap from "@utils/buildTagPostsMap";
import { getSortedPostsByLocale, getUniqueTagsByLocale } from "@utils/posts";
import { getPostSlug } from "@utils/slugify";
import type { GetStaticPathsOptions } from "astro";

export async function getPostsStaticPaths(
  locale: Locale,
  { paginate }: GetStaticPathsOptions
) {
  const posts = await getSortedPostsByLocale(locale);
  return paginate(posts, { pageSize: SITE.postPerPage });
}

export async function getPostDetailsStaticPaths(locale: Locale) {
  const posts = await getSortedPostsByLocale(locale);

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id) },
    props: { post },
  }));
}

export async function getTagPostsStaticPaths(
  locale: Locale,
  { paginate }: GetStaticPathsOptions
) {
  const posts = await getSortedPostsByLocale(locale);
  const tags = await getUniqueTagsByLocale(locale);
  const tagPostsMap = buildTagPostsMap(posts);

  return tags.flatMap(({ tag, tagName }) => {
    const tagPosts = tagPostsMap.get(tag) ?? [];

    return paginate(tagPosts, {
      params: { tag },
      props: { tagName },
      pageSize: SITE.postPerPage,
    });
  });
}
