# Beauty Space Co

Beauty Space Co is a bilingual marketing site for Bare Skin Co and Cherry Glow
Studio, two estheticians offering waxing and brow services in the Dundee,
Illinois area. It is a static, client-rendered site built with React, TypeScript,
Vite, React Router, and Tailwind CSS 4. Booking and social links point to
external sites. The booking link in `src/config/site.ts` is a placeholder.

## Project map

- `src/routes/routes.ts` defines the shared English and Spanish routes. The
  home pages are `/` and `/es`. `src/locales/bootstrap.ts` checks the browser
  language once per tab when deciding whether to send `/` to `/es`.
- `src/locales/en.json` and `src/locales/es.json` hold visitor-facing copy.
  Update both when changing copy, including accessible labels. Keep route
  changes in sync with localized navigation and the sitemap as applicable.
- `src/pages/` contains the home and not-found pages. Shared layout and sections
  live in `src/components/`, site links in `src/config/site.ts`, and theme
  tokens in `src/index.css`. Reuse the existing Tailwind tokens and preserve
  keyboard navigation, visible focus, and reduced-motion behavior in UI edits.
- `src/assets/` holds imported images that Vite fingerprints. `public/` holds
  files served at stable URLs, including `robots.txt` and `sitemap.xml`.

## Local workflow

- Use the Node version in `.nvmrc` and the pnpm version in `package.json`.
  Install from the existing lockfile with `pnpm install --frozen-lockfile`.
- Use `pnpm dev` for development and `pnpm run build` to produce `dist/`.
- Run `pnpm check` for type checking, Oxlint, Oxfmt, and Vitest. For a focused
  test, run `pnpm test <test-file>`. Follow `.oxlintrc.json` and `.oxfmtrc.json`
  for linting and formatting, including TOML formatting.
- Run `pnpm test:a11y` for UI changes that affect accessibility. The Playwright
  suite exercises the production build in Chromium and WebKit. Install the
  browsers with `pnpm exec playwright install chromium webkit` if needed.

## Netlify

- `netlify.toml` runs `pnpm test && pnpm run build` and publishes `dist/`, so a
  failing unit test stops the deploy. Keep the quoted `"$schema"` key at the
  top.
- Add a `200` rewrite to `/index.html` for each new client route that needs one.
  `/` already resolves to `index.html`. Keep those rewrites above the final
  `/*` fallback, which serves the app with a real `404` status.
  `src/tests/notFound.test.mts` checks that the route and rewrite lists agree,
  and that `public/sitemap.xml` lists exactly those pages, with their English
  and Spanish versions.
- The `/assets/*` rule gives fingerprinted assets a one-year immutable browser
  cache. Keep stable URLs, including HTML, outside that rule. The `/*` rule
  sets security headers and also matches `/assets/*`, so it must never set
  `Cache-Control`. Use a Netlify Deploy Preview to verify Netlify-specific
  status codes and response headers.

## Netlify tools for coding agents

- Before changing Netlify behavior, read the relevant `SKILL.md` in
  [`.agents/skills/`](.agents/skills/). Open the file directly if your agent
  does not discover skills from that directory.
- Start with [netlify-config](.agents/skills/netlify-config/SKILL.md) for
  `netlify.toml`, redirects, headers, and plugins,
  [netlify-deploy](.agents/skills/netlify-deploy/SKILL.md) for deploys and
  previews, [netlify-frameworks](.agents/skills/netlify-frameworks/SKILL.md)
  for Vite integration, and
  [netlify-caching](.agents/skills/netlify-caching/SKILL.md) for caching.
- Use the Netlify MCP server for live project and deploy information when your
  client has an authorized connection. Codex's project entry is in
  [`.codex/config.toml`](.codex/config.toml). Other clients can connect to the
  same endpoint at `https://mcp.netlify.com/mcp`. If MCP is unavailable, use
  the Netlify CLI where authenticated and consult the
  [official Netlify docs](https://docs.netlify.com/llms.txt) for platform behavior.
