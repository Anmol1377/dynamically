# Example: Next.js marketing site

Minimal Next.js 14 (App Router) site that pulls its content from a running Dynamically instance via `@dynamically/client/next`.

## Run

In one terminal, start Dynamically (from repo root):

```bash
pnpm dev
# → http://localhost:3030
```

Sign in, create an API key in Settings, and publish a page named `home` with a `hero` section.

In another terminal:

```bash
cd examples/next-marketing-site
cp .env.example .env.local
# edit .env.local, paste the API key
pnpm dev
# → http://localhost:3001
```

The page reads `home.sections.hero.headline` (and a few other fields) and renders them. Edit the content in Dynamically, hit Publish, then refresh after Next.js' 60s ISR window — content updates without a redeploy.

## What this demonstrates

- `dynamicallyForNext()` reads `DYNAMICALLY_URL` and `DYNAMICALLY_API_KEY` from env
- Typed access via `client.getPage<HomeSections>('home')`
- Error handling for `DynamicallyApiError`
- ISR with `export const revalidate = 60`
