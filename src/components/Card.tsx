import { slugifyStr } from "@utils/slugify";
import { type Locale } from "@i18n/utils";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
  locale?: Locale;
}

export default function Card({
  href,
  frontmatter,
  secHeading = true,
  locale = "en",
}: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "text-xl font-semibold decoration-dashed underline-offset-4 hover:underline",
  };

  return (
    <li className="paper-surface paper-surface-hover my-6 p-5 sm:p-6">
      <a
        href={href}
        className="inline-block text-skin-accent decoration-dashed focus-visible:no-underline focus-visible:underline-offset-0"
      >
        {secHeading ? (
          <h2 {...headerProps}>{title}</h2>
        ) : (
          <h3 {...headerProps}>{title}</h3>
        )}
      </a>
      <Datetime
        pubDatetime={pubDatetime}
        modDatetime={modDatetime}
        className="mt-2"
        locale={locale}
      />
      <p className="mt-3 text-[0.98rem] leading-7 text-skin-base/90">
        {description}
      </p>
    </li>
  );
}
