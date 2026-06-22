import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://ernanvelasquez.com",
  author: "Ernán Velásquez",
  profile: "https://www.linkedin.com/in/ernanvr/",
  desc: "Building AI services in El Salvador. Writing about startups, technology, philosophy, and meaningful work.",
  title: "Ernán Velásquez",
  ogImage: "ernan-og-image.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showAbout: false, // Set to true to show About link in navigation
  editPost: {
    url: "https://github.com/ernanvr/ernanvr.github.io/edit/main/src/content/blog",
    text: "Suggest Changes",
    appendFilePath: true,
  },
};

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/ernanvr",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/ernanvr/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "https://forms.gle/KfmbWLdteC3uAnPG8",
    linkTitle: `Open contact form for ${SITE.title}`,
    active: true,
    openInNewTab: true,
  },
];
