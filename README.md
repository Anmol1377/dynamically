# Dynamically

> Self-hosted, API-first headless content layer for Next.js / React marketing sites. Pages → Sections → Fields, ACF-style. **MIT licensed.**

Built for the recurring pain: marketing keeps pinging developers to change the hero copy, swap an image, or tweak a CTA. Dynamically gives non-technical editors a clean admin UI; your frontend reads the published content over a typed REST API and keeps shipping.

```
┌─ Admin (Next.js) ─────────┐    GET /api/v1/pages/home
│  Pages → Sections → Fields│    Authorization: Bearer dyn_pub_…
│  Auto-saving content edit │◀─────────────────────────────┐
│  Publish → public API     │    @anmollabs/dynamically-client        │
└────────────┬──────────────┘    in your Next.js app ────▶ Your site
             │
             ▼
        SQLite (file)
        ./uploads/
```

## Status

**Pre-1.0 (working alpha).** All four core flows work end-to-end:

- ✅ Schema builder — pages, sections, fields with 12 field types
- ✅ Content editor — debounced auto-save, draft / publish / discard, "unpublished changes" indicator
- ✅ Public REST API + JSON serializer with API-key auth
- ✅ TypeScript SDK (`@anmollabs/dynamically-client`) with a Next.js helper
- ✅ Media library with image upload, alt text, and metadata expansion in API
- ✅ Rich text via Tiptap

Coming next (M5.5 / M6 polish): repeater + group field types, npm-published packages, automated CI.

## Quick start

### Docker — one-command self-host (recommended)

The image is published on [Docker Hub](https://hub.docker.com/r/anmol1377/dynamically) for `linux/amd64` + `linux/arm64`. No git clone needed:

```bash
mkdir my-cms && cd my-cms
curl -O https://raw.githubusercontent.com/Anmol1377/dynamically/main/docker-compose.yml
docker compose up -d
# → open http://localhost:3030 — setup wizard runs on first boot
```

The image auto-runs migrations on every container start. Persistent data lives in the `dynamically-data` named volume (DB + uploads).

To pin a specific version instead of `latest`:

```bash
docker pull anmol1377/dynamically:0.1.0
```

### Scaffold a new instance from npm

If you want to **edit the source** (add custom field types, fork the admin UI, etc.) instead of running the prebuilt image:

```bash
npx create-dynamically-app my-content
cd my-content && npm run dev
```

This downloads the [`create-dynamically-app`](https://www.npmjs.com/package/create-dynamically-app) scaffolder, copies the full app template, runs `npm install`, and applies the initial database migration. Open http://localhost:3030 to complete setup.

### Develop the project itself

```bash
git clone https://github.com/Anmol1377/dynamically.git
cd dynamically
pnpm install
pnpm db:migrate
pnpm dev
# → http://localhost:3030
```

To build & test the Docker image locally before pushing:

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Field types (12)

Text · Textarea · Rich text (Tiptap) · Number · Boolean · URL · Email · Image · Select · Multi-select · Color · Date

Repeater + Group (recursive nested fields) are scaffolded in the registry and land in M5.5.

## Consuming content from your frontend

### 1. Create an API key

In the admin UI: **Settings → API keys → + Create API key**.

- **Name** — anything human-readable (`Production frontend`, `Local dev`, etc.)
- **Scope** — see the next subsection.

> ⚠️ **The plaintext key is shown only once.** Copy it immediately. Lost the key? Revoke it and create a new one — you can't recover the original.

### Read keys vs preview keys

Two scopes for two different jobs:

| | Read key (`dyn_pub_…`) | Preview key (`dyn_prv_…`) |
|---|---|---|
| Sees **published** content | ✅ | ✅ |
| Sees **draft** (unpublished) content | ❌ → 403 | ✅ (with `?preview=true`) |
| Where it goes | Production / staging frontends | Internal preview routes |
| Blast radius if leaked | Only public content | Includes WIP drafts |

**What "draft" vs "published" actually means.** In Dynamically every field has up to two stored versions:

- **draft** — what an editor is typing right now (auto-saves every 1s)
- **published** — what's been pushed live by clicking Publish

The public API serves **published** by default. Adding `?preview=true` returns the **draft** — but only if the request is authorized with a preview-scope key (read keys hit a 403).

**When to use each.**

- **Read key** → your production site / public app. If it leaks, an attacker sees your published site, which is already public anyway.
- **Preview key** → a `/preview` route, Next.js draft mode, or a staging deploy where editors review unpublished changes before hitting Publish. If a preview key leaks, drafts (embargoed announcements, draft pricing, WIP copy) leak too — so guard it more carefully.

**What happens if you mix them up.**

```bash
# read key + preview=true → blocked by design
curl -H "Authorization: Bearer dyn_pub_…" \
  "http://localhost:3030/api/v1/pages/home?preview=true"
# → 403 {"error":{"code":"FORBIDDEN","message":"This endpoint requires a preview-scope key"}}

# preview key on production → works, but exposes drafts publicly
# (don't do this — keep prod read-only)
```

**Recommended setup for a real project**

- One read key per environment: `Production frontend`, `Staging frontend`, `Local dev`
- One preview key, used only by your `/preview` route or a dedicated review deploy
- Rotate read keys when teammates leave; rotate the preview key when external reviewers leave the project

### 2. Wire up your frontend

The SDK is published as [`@anmollabs/dynamically-client`](https://www.npmjs.com/package/@anmollabs/dynamically-client) on npm. Install it directly:

```bash
pnpm add @anmollabs/dynamically-client
# or: npm install @anmollabs/dynamically-client
```

Add env vars to your frontend's `.env.local`:

```bash
DYNAMICALLY_URL=http://localhost:3030
DYNAMICALLY_API_KEY=dyn_pub_paste_the_full_key_here
```

> Use `DYNAMICALLY_API_KEY` (not `NEXT_PUBLIC_…`) — this keeps the key server-side. **Never put an API key in a `NEXT_PUBLIC_*` variable** — those ship to the browser.

#### Use it in any Server Component

```ts
// app/page.tsx
import { dynamicallyForNext } from '@anmollabs/dynamically-client/next';

type HomeSections = {
  hero?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    background?: { url: string; width: number | null; height: number | null; alt: string } | null;
  };
};

export const revalidate = 60;  // ISR — re-fetch every 60s

export default async function HomePage() {
  const home = await dynamicallyForNext().getPage<HomeSections>('home');
  const hero = home.sections.hero ?? {};
  return (
    <main>
      <h1>{hero.headline}</h1>
      {hero.subheadline && <p>{hero.subheadline}</p>}
      {hero.ctaText && <a href={hero.ctaUrl ?? '#'}>{hero.ctaText}</a>}
    </main>
  );
}
```

That's the whole flow. Working example at [examples/next-marketing-site/](./examples/next-marketing-site/).

#### Other frameworks — raw `fetch` works fine

The API is plain REST, so the SDK is optional. Astro, Remix, Nuxt, Express, Cloudflare Workers — all work:

```ts
const res = await fetch(`${process.env.DYNAMICALLY_URL}/api/v1/pages/home`, {
  headers: { Authorization: `Bearer ${process.env.DYNAMICALLY_API_KEY}` },
});
const home = await res.json();
```

#### Custom typed wrapper (if you don't want a runtime dep)

The SDK is a thin wrapper. You can drop a one-file helper into your project instead:

```ts
// lib/dynamically.ts
const baseUrl = process.env.DYNAMICALLY_URL!;
const apiKey = process.env.DYNAMICALLY_API_KEY!;

export async function getPage<T = Record<string, Record<string, unknown>>>(slug: string) {
  const res = await fetch(`${baseUrl}/api/v1/pages/${slug}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Dynamically fetch failed: ${res.status}`);
  return (await res.json()) as { slug: string; title: string; status: string; updatedAt: string; sections: T };
}
```

#### Browser-only SPA (Vite, CRA, plain React) — special case

**API keys must never reach the browser**, regardless of which option above you pick. Two paths for SPAs:

1. **Server-side proxy.** Stand up a tiny backend route (Express, Hono, Cloudflare Worker, your own /api endpoint) that fetches from Dynamically server-side and exposes a CORS-friendly endpoint to your SPA.
2. **Anonymous public reads.** In **Settings → General**, toggle on **"Allow anonymous public reads"**. Then `GET /api/v1/pages/home` works with no auth header. Only use for content that's genuinely public — anyone who can reach your Dynamically instance can read it.

### 3. Preview / draft mode

Want unpublished drafts on a `/preview` route or in Next.js draft mode?

```ts
import { createClient } from '@anmollabs/dynamically-client';

const previewClient = createClient({
  baseUrl: process.env.DYNAMICALLY_URL!,
  apiKey: process.env.DYNAMICALLY_PREVIEW_KEY!,  // dyn_prv_...
  preview: true,
});

const draft = await previewClient.getPage('home');
```

The preview-scope key returns the latest draft instead of the published version. A read-scope key with `preview: true` gets a 403.

---

## Going to production — deploy checklist

1. **Deploy Dynamically somewhere with persistent disk.** Vercel/Netlify won't work — they're stateless and SQLite + uploads need a real disk. Use:
   - **Easiest:** Railway, Render, Fly.io (one-click templates, persistent volumes built in)
   - **Self-managed:** Any VPS (DigitalOcean, Hetzner, etc.) + `docker compose up -d`
2. **Note your production URL** — e.g., `https://content.yoursite.com`
3. **Create a fresh API key** in that production instance's **Settings → API keys**. Don't reuse dev keys.
4. **In your frontend hosting** (Vercel, Netlify, etc.) set env vars:
   ```
   DYNAMICALLY_URL=https://content.yoursite.com
   DYNAMICALLY_API_KEY=dyn_pub_<the new prod key>
   ```
5. Deploy your frontend. Done.

### Security cheat sheet

| Do | Don't |
|---|---|
| Use `DYNAMICALLY_API_KEY` (server-only env) | Use `NEXT_PUBLIC_DYNAMICALLY_API_KEY` |
| Call the SDK from Server Components / API routes / `getServerSideProps` | Call it from `'use client'` components |
| One key per environment (dev / staging / prod) | Reuse the same key everywhere |
| Rotate keys: create new → update env → revoke old | Revoke first, then panic when prod breaks |
| HTTPS for your Dynamically instance in prod | Run with `publicReadEnabled` on the open internet unless you mean to |

### Test the API in Postman

The repo ships an importable Postman collection at [`postman/dynamically.postman_collection.json`](./postman/dynamically.postman_collection.json).

**1. Import**

Open Postman → **Import** (top left) → drop in the file. The collection appears as **Dynamically — Public API**.

**2. Set collection variables**

Click the collection → **Variables** tab → fill the **Current value** column:

| Variable | Example | What it is |
|---|---|---|
| `baseUrl` | `http://localhost:3030` | Your Dynamically instance |
| `apiKey` | `dyn_pub_2b54dce7…` | Read-scope key from Settings → API keys |
| `previewKey` | `dyn_prv_452847a2…` | Preview-scope key (optional, only for the preview request) |
| `pageSlug` | `home` | Slug to fetch in the "Get a page" request |

Save the collection.

**3. Send requests**

Six requests are pre-configured and sit in the collection sidebar — covering both auth paths:

**With an API key** (production-style)

| Request | Method + path | What it does |
|---|---|---|
| List published pages | `GET /api/v1/pages` | All pages with `status='published'` |
| Get a page by slug | `GET /api/v1/pages/{{pageSlug}}` | Full content tree (sections + fields) |
| Get a page (preview / draft) | `GET /api/v1/pages/{{pageSlug}}?preview=true` | Latest draft — uses `{{previewKey}}` |

**Without an API key** (anonymous public-read mode)

| Request | Method + path | What it does |
|---|---|---|
| Anonymous read (public mode on) | `GET /api/v1/pages/{{pageSlug}}` *(no auth)* | Returns 200 when **Settings → General → Allow anonymous public reads** is toggled ON. Useful for browser SPAs that can't safely hold a key. |
| 401 — missing key (public mode off) | `GET /api/v1/pages/{{pageSlug}}` *(no auth)* | Same request, but returns 401 when public reads are off (the default). |
| 404 — unknown slug | `GET /api/v1/pages/does-not-exist` | Sanity check JSON 404 shape |

Authentication is set at the **collection level** as `Bearer {{apiKey}}`, so all requests inherit it. The preview request overrides to `{{previewKey}}`. The two no-auth requests override to "no auth".

**4. Quick curl equivalents**

**With API key:**
```bash
# List
curl -H "Authorization: Bearer $API_KEY" http://localhost:3030/api/v1/pages | jq

# Single page
curl -H "Authorization: Bearer $API_KEY" http://localhost:3030/api/v1/pages/home | jq

# Preview / draft
curl -H "Authorization: Bearer $PREVIEW_KEY" "http://localhost:3030/api/v1/pages/home?preview=true" | jq
```

**Without API key (anonymous mode — toggle on Settings → General → "Allow anonymous public reads" first):**
```bash
# No Authorization header — returns 200 when public reads are enabled,
# 401 when they're not.
curl http://localhost:3030/api/v1/pages/home | jq
```

See [postman/README.md](./postman/README.md) for the standalone collection guide.

### Cache invalidation

Right now content updates land on the frontend on the next ISR window (`revalidate: 60` = up to 60s). For instant updates you have two options:

1. Set `revalidate: 0` — no cache, every request hits the API. Simple, slower per request.
2. (Coming in v1.1) Webhook from Dynamically on Publish → calls `revalidatePath()` on your frontend automatically.

For most marketing sites, 60-second ISR is the sweet spot — fast pages, content updates within a minute of Publish.

## Architecture

| Layer | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Web app | Next.js 14 (App Router) |
| Backend | Next.js Route Handlers + Server Actions |
| DB | SQLite via better-sqlite3 + Drizzle ORM |
| Auth | argon2id passwords, SHA-256-keyed session table, httpOnly cookies |
| API auth | Bearer API keys (`dyn_pub_…` read, `dyn_prv_…` preview), SHA-256 hashed at rest |
| File storage | Local filesystem, served with `Cache-Control: public, max-age=31536000, immutable` |
| Image probing | sharp |
| Rich text | Tiptap (StarterKit + Link) |
| UI | Tailwind + shadcn-style components + Radix Dialog |

Single Node process serves both the admin UI and the public API. SQLite scales easily to thousands of pages and hundreds of editors.

## Resetting local state

```bash
rm apps/web/data/dynamically.db*       # nuke DB
rm -rf apps/web/uploads                 # nuke files
pnpm db:migrate                         # recreate schema → setup wizard fires again
```

### Seeding a test admin (skip the wizard)

```bash
cd apps/web && pnpm tsx scripts/seed-test-admin.ts
# → test@example.com / password123
```

## Project layout

```
.
├── apps/web              # the admin UI + public API (Next.js)
├── packages/
│   └── client            # @anmollabs/dynamically-client SDK
├── packages/
│   └── create-dynamically-app  # scaffolder CLI
├── examples/
│   └── next-marketing-site     # end-to-end consumer demo
├── Dockerfile
├── docker-compose.yml
├── PRD.md
├── TECHNICAL_IMPLEMENTATION.md
└── PROGRESS.md
```

## Documentation

- [PRD.md](./PRD.md) — product requirements, scope, personas
- [TECHNICAL_IMPLEMENTATION.md](./TECHNICAL_IMPLEMENTATION.md) — architecture, schema, milestones
- [PROGRESS.md](./PROGRESS.md) — milestone tracker + decisions log

## Security baseline

- argon2id password hashes (memory-hard)
- Login rate-limit: 5 attempts / 15 min per (IP, email) pair
- Session tokens: cryptographic random, SHA-256 hashed in DB, httpOnly + SameSite=Lax cookies, sliding expiry
- API keys: SHA-256 hashed at rest, plaintext shown once on creation, prefix-only display thereafter
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Upload validation: 10 MB cap, mime allowlist, random hex filenames (no path traversal)

## License

MIT — see [LICENSE](./LICENSE).
