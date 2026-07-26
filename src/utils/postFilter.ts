import { SITE } from "@config";
import type { CollectionEntry } from "astro:content";

/**
 * A post is publishable when it is not a draft and its publish time has passed.
 * Archived posts are still publishable: they keep their detail page and are
 * listed on the archives pages.
 */
export const isPublishable = ({ data }: CollectionEntry<"blog">) => {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
};

/** Posts that belong to the normal published feed (home, tags, search, RSS). */
const postFilter = (entry: CollectionEntry<"blog">) =>
  isPublishable(entry) && !entry.data.archived;

export default postFilter;
