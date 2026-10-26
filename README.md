# hrva.cc — URL Shortener Frontend

The web app for [hrva.cc](https://app.hrva.cc): short links, bio pages at `hrva.cc/@yourname`, privacy-first link analytics, passkey and two-step sign-in, the public [hrva.cc in numbers](https://app.hrva.cc/stats) page, help pages, and the admin tools. The API lives in [HrvaLabs/url-shortener](https://github.com/HrvaLabs/url-shortener).

Next.js 16 App Router + React 19, deployed on Cloudflare Workers via `@opennextjs/cloudflare`.

See [AGENTS.md](./AGENTS.md) for architecture, commands, and gotchas.

## Development

- `npm run dev` starts the app locally. AGENTS.md explains how to point it at a local backend.
- `npm run build`, `npx tsc --noEmit` and `npm run lint` are the checks every change runs.
- `npm run check:bio` checks the bio page text rules and that no invisible characters slipped into the source. It needs Node 22.18 or newer.

## Deployment

The production Cloudflare Worker `url-shortener` is connected to the
[HrvaLabs/URL-Shortener-FE](https://github.com/HrvaLabs/URL-Shortener-FE)
repository. Pushing to `main` triggers Workers Builds, using `npm run build`
and `npm run deploy`. Preview branches use a separate build trigger.
