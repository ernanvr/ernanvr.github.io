import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  redirects: {
    // Both language versions were rewritten from a 21-principle summary into a
    // personal essay and re-slugged. Keep the published URLs resolving.
    "/es/posts/how-to-win-friends-and-influence-people-key-insights-es":
      "/es/posts/tres-lecciones-que-me-cambiaron-la-vida",
    "/posts/how-to-win-friends-and-influence-people-key-insights":
      "/posts/three-lessons-that-changed-my-life",
  },
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [
          remarkCollapse,
          {
            test: "Table of contents",
          },
        ],
      ],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  scopedStyleStrategy: "where",
});
