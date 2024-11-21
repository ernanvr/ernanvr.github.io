export type Image = {
  src: string;
  alt?: string;
  caption?: string;
};

export type Link = {
  text: string;
  href: string;
};

export type Hero = {
  title?: string;
  text?: string;
  image?: Image;
  actions?: Link[];
};

export type Subscribe = {
  title?: string;
  text?: string;
  formUrl: string;
};

export type SiteConfig = {
  logo?: Image;
  title: string;
  subtitle?: string;
  description: string;
  image?: Image;
  headerNavLinks?: Link[];
  footerNavLinks?: Link[];
  socialLinks?: Link[];
  hero?: Hero;
  subscribe?: Subscribe;
  postsPerPage?: number;
  projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
  title: "Ernán Velásquez",
  subtitle: "De aprendizajes diarios a logros futuros",
  description: "¡Bienvenido a mi espacio!",
  image: {
    src: "/blog.png",
    alt: "Dante - Astro.js and Tailwind CSS theme",
  },
  headerNavLinks: [
    {
      text: "Home",
      href: "/",
    },
    {
      text: "Projects",
      href: "/projects",
    },
    {
      text: "Blog",
      href: "/blog",
    },
    {
      text: "Tags",
      href: "/tags",
    },
  ],
  footerNavLinks: [
    {
      text: "About",
      href: "/about",
    },
    {
      text: "Contact",
      href: "/contact",
    },
    {
      text: "Terms",
      href: "/terms",
    },
  ],
  socialLinks: [
    {
      text: "LinkedIn",
      href: "https://www.linkedin.com/in/ernanvr/",
    },
    {
      text: "X/Twitter",
      href: "https://x.com/ernanvr",
    },
  ],
  hero: {
    title: "¡Bienvenido a mi rincón de internet!",
    text: "Este es un rincón donde comparto mis pensamientos, experiencias y proyectos. Espero que encuentres algo que te inspire y te acompañe en tu propio viaje.",
    image: {
      src: "/desktop.jpg",
      alt: "A person sitting at a desk in front of a computer",
    },
    actions: [
      {
        text: "Get in Touch",
        href: "/contact",
      },
    ],
  },
  subscribe: {
    title: "Subscribe to Dante Newsletter",
    text: "One update per week. All the latest posts directly in your inbox.",
    formUrl: "#",
  },
  postsPerPage: 8,
  projectsPerPage: 8,
};

export default siteConfig;
