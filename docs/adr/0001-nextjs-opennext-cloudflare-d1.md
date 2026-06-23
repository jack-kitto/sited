# Next.js on Cloudflare Workers via OpenNext, with D1

We build the Clock-In App as a single Next.js app deployed to Cloudflare Workers using OpenNext (`@opennextjs/cloudflare`), with Route Handlers serving as the API and Cloudflare D1 as the database. This gives us one app and one deploy target, edge hosting, and a managed SQL store, at the cost of OpenNext's adapter constraints and Cloudflare/D1 lock-in.

## Considered Options

- **Node.js (Express/Fastify) + SQLite** — simplest to run locally and host anywhere, but we'd self-manage hosting and have no edge distribution.
- **Next.js frontend + a separate standalone Worker API sharing D1** — cleaner separation but two deploy units and more wiring for a small app.
- **Next.js + OpenNext + D1 (chosen)** — one coherent app, edge-hosted, managed DB.

## Consequences

- We are bound to Cloudflare's runtime (Workers, not full Node) and to D1's SQLite dialect and limits.
- Database access happens through the Cloudflare D1 binding, available only inside the Worker request context.
