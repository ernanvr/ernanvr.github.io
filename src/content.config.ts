import { SITE } from "@config";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      archived: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200 X 630 pixels!",
        })
        .or(z.string())
        .optional(),
      description: z.string(),
      lang: z.enum(["en", "es"]).default("en"),
      /**
       * Slug of this same article in the other language. Declared rather than
       * guessed: the two locales use different slugs
       * (`three-lessons-that-changed-my-life` vs
       * `tres-lecciones-que-me-cambiaron-la-vida`), so no amount of path
       * manipulation can derive one from the other. One direction is enough —
       * the resolver mirrors it — but both are usually written for clarity.
       */
      translation: z.string().optional(),
      canonicalURL: z.string().optional(),
      editPost: z
        .object({
          disabled: z.boolean().optional(),
          url: z.string().optional(),
          text: z.string().optional(),
          appendFilePath: z.boolean().optional(),
        })
        .optional(),
    }),
});

export const collections = { blog };
