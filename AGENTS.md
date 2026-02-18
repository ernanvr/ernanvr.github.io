# AGENTS.md

Practical guidance for agentic coding tools working in this repository.

## Purpose
- Keep changes aligned with the existing Astro + TypeScript + Tailwind patterns.
- Run the same checks used in CI before handing work back.
- Preserve i18n, content schema, and route behavior.

## Project Snapshot
- Framework: Astro 4 (`astro`), with React components for interactive islands.
- Language: TypeScript in strict mode (`astro/tsconfigs/strict`).
- Styling: Tailwind CSS + CSS variables in `src/styles/base.css`.
- Content: Astro content collection under `src/content/blog/{en,es}`.
- Package manager: npm (`package-lock.json` is committed).
- CI baseline: Node 18 (`.github/workflows/ci.yml`).

## Source Map
- `src/pages/`: routes and API routes (`rss.xml.ts`, `robots.txt.ts`, OG PNG routes).
- `src/layouts/`: page wrappers and shared page-level composition.
- `src/components/`: Astro and React components.
- `src/utils/`: post/tag helpers, slug helpers, OG image helpers.
- `src/i18n/`: locale definitions, route localization, UI strings.
- `src/content/config.ts`: frontmatter/content schema.
- `src/config.ts`: site-wide constants (`SITE`, socials, pagination).

## Install and Local Development
```bash
npm ci
npm run dev
```

## Build / Lint / Format / Validate
```bash
# Build
npm run build

# Preview built site
npm run preview

# Sync Astro types/content metadata
npm run sync

# Lint whole repo
npm run lint

# Prettier check (whole repo)
npm run format:check

# Prettier write (whole repo)
npm run format

# Astro diagnostics/type checks
npx astro check
```

## Single-File and Single-Test Commands

There is currently no dedicated unit/integration test runner configured.

- No `test` script exists in `package.json`.
- No Vitest/Jest/Playwright/Cypress config was found.
- Running a single test is currently not available.

Closest targeted checks:
```bash
# Lint one file
npx eslint src/components/Search.tsx

# Format-check one file
npx prettier --check src/components/Search.tsx --plugin=prettier-plugin-astro

# Project-level Astro diagnostics
npx astro check
```

If you add a test framework, also add exact full-suite and single-test commands here.

## CI Parity Command
```bash
npm run lint && npm run format:check && npm run build
```
CI currently enforces those three checks.

## Language Auto-Detection QA Checklist
- Clear preference first: `localStorage.removeItem("preferredLocale")`.
- Spanish browser (`es`, `es-ES`, `es-419`, `es-MX`, etc.) landing on `/` should redirect to `/es/` using `replace`.
- Non-Spanish browser landing on `/es/` should redirect to `/` using `replace`.
- First visit on an already-correct locale should not redirect, but should persist `preferredLocale`.
- Manual language switch (EN/ES links) should update `preferredLocale` before navigation.
- Existing `preferredLocale` should prevent further auto-redirects on subsequent visits.
- Bot/crawler user agents should skip auto-detection/redirect logic.

## Formatting Rules (from `.prettierrc`)
- Semicolons: required.
- Indentation: 2 spaces.
- Print width: 80.
- Quotes: double quotes in JS/TS.
- Trailing commas: ES5 style.
- Plugins: `prettier-plugin-astro`, `prettier-plugin-tailwindcss`.
- Respect `.prettierignore` (format scope intentionally limited).

## Lint and Type Rules
- ESLint uses `@eslint/js`, `typescript-eslint`, and `eslint-plugin-astro` recommended configs.
- `globals` include browser + node environments.
- `*.astro` files are parsed with `astro-eslint-parser` and TypeScript parser.
- Keep strict typing; avoid `any` unless unavoidable.
- Prefer `import type` for type-only imports.

## Import Conventions
Follow existing order used across `src/`:
1. External packages (`astro:*`, `react`, npm libs).
2. Internal aliases (`@config`, `@utils/*`, `@components/*`, etc).
3. Relative imports (`./`, `../`).

Additional import guidance:
- Keep imports explicit and readable.
- Prefer path aliases from `tsconfig.json` over deep relative paths.
- Keep type/value imports clear (inline `type` modifiers are common here).

## Naming Conventions
- Components/layout files: `PascalCase` (e.g., `Header.astro`, `Search.tsx`).
- Utility files/functions: `camelCase` (e.g., `getSortedPosts.ts`).
- Global constants: `UPPER_SNAKE_CASE` (e.g., `SITE`, `SUPPORTED_LOCALES`).
- Route file names follow Astro conventions (`[slug]`, `[...page]`).
- Translation keys use dotted namespaces (`nav.search`, `post.nextPost`).

## Astro and React Patterns
- Prefer Astro for static rendering; use React only where interactivity is needed.
- Use `client:*` directives intentionally (`client:load` is used for search).
- For post listings/pages, filter by locale and draft status consistently.
- Preserve canonical + alternate locale link behavior in `src/layouts/Layout.astro`.

## Content and i18n Rules
- Frontmatter must satisfy `src/content/config.ts` schema.
- `lang` is limited to `en` or `es`.
- Required frontmatter: `pubDatetime`, `title`, `description`.
- Keep localized slugs/routes aligned with `src/i18n/utils.ts`.
- Keep translation keys synchronized across `src/i18n/ui.ts` locales.

## Error Handling Expectations
- Prefer guard clauses for invalid states.
- Throw explicit errors when external fetch/resource steps fail.
- Validate HTTP responses (`res.ok`) before reading body data.
- Do not silently swallow failures.

## Styling Guidelines
- Reuse existing skin tokens (`text-skin-*`, `bg-skin-*`, `border-skin-*`).
- Keep light/dark theme compatibility intact.
- Prefer utility classes; use scoped `<style>` in Astro when it improves clarity.
- Do not hand-edit generated Tailwind class ordering; let Prettier plugin sort.

## Design System Decisions

### Visual Direction
- Theme name: `Workshop Warmth`.
- Intent: personal, warm, handcrafted reading space that still feels technical.
- Signature treatment: post cards use subtle paper-like gradients (`bg-paper`) plus gentle elevation.

### Color Tokens (`src/styles/base.css`)
Light mode:
- `--color-fill: 252, 250, 245` (warm cream canvas)
- `--color-text-base: 38, 32, 28` (ink-like charcoal)
- `--color-accent: 192, 86, 33` (terracotta accent)
- `--color-card: 247, 242, 235` (paper card)
- `--color-card-muted: 236, 222, 205` (muted warm surface)
- `--color-border: 230, 220, 208` (soft separator)
- `--color-gradient-start: 252, 248, 242`
- `--color-gradient-end: 247, 242, 235`

Dark mode:
- `--color-fill: 28, 25, 23`
- `--color-text-base: 242, 238, 232`
- `--color-accent: 234, 128, 74`
- `--color-card: 44, 38, 35`
- `--color-card-muted: 82, 58, 42`
- `--color-border: 92, 75, 61`
- `--color-gradient-start: 53, 45, 40`
- `--color-gradient-end: 41, 36, 33`

### Typography
- UI and headings: `IBM Plex Mono` (`font-mono`).
- Long-form body copy: `Merriweather` (`font-serif`).
- Code remains monospaced.
- Rule: keep monospace for navigation, metadata, controls, and display headings; use serif for paragraphs and article prose.

### Spacing and Depth
- Spacing rhythm to preserve: 4 / 16 / 32 / 56 / 80 px progression.
- Elevation strategy: subtle border + soft shadow (no heavy/glassy shadows).
- Tailwind tokens added in `tailwind.config.cjs`:
  - `shadow-card`
  - `shadow-card-hover`
  - `bg-paper`

### Reusable Surface Patterns
- `paper-surface`: rounded border, paper gradient, soft shadow.
- `paper-surface-hover`: small lift + border/shadow transition.
- Prefer these classes for cards, inline action panels, and utility containers.

### Consistency Rules for Future Work
- Keep the warm palette; avoid introducing cold grayscale or bright blue accents.
- Maintain the mono-for-UI and serif-for-reading split.
- Use existing surface utilities instead of inventing one-off card styles.
- Keep dark mode parity for all new visual changes.

## Generated Files and Artifacts
- Do not edit `dist/` or `.astro/` build artifacts manually.
- Make source edits in `src/`, root config files, or `public/` as appropriate.

## Commit Hygiene
- Keep commits focused and task-specific.
- Conventional commit style is preferred (`cz.yaml` uses `cz_conventional_commits`).
- Avoid unrelated formatting/refactor churn in feature/fix commits.
- **Prefix every commit title with a gitmoji icon** from [gitmoji.dev](https://gitmoji.dev) that best matches the intent. Use the emoji character directly (not the `:code:` shorthand). Common mappings:
  - ✨ new feature
  - 🐛 bug fix
  - 📝 documentation / content
  - ♻️ refactor
  - 🔧 configuration files
  - 🎨 code structure / formatting
  - ⚡️ performance improvement
  - 🌐 i18n / localization
  - 💄 UI / style changes
  - 🚑️ critical hotfix
  - ✅ tests
  - 👷 CI / build system
  - 🔖 release / version tag
  - 🚚 move or rename files
  - 🗑️ deprecate or remove code
  - 🩹 simple non-critical fix

## Cursor and Copilot Rule Files
Checked requested locations:
- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.

No additional Cursor/Copilot-specific instruction files were found.
