# Dynamically — Product Requirements Document (MVP)

> **Status:** Draft v0.1
> **Owner:** Product
> **Last updated:** 2026-04-29
> **Document type:** PRD — MVP scope

---

## 1. Executive Summary

**Dynamically** is a self-hosted, API-first, headless content management layer purpose-built for developers shipping marketing sites with **Next.js / React / Vue / any modern frontend**.

It solves a single, painful, recurring problem: *developers keep getting pulled in by marketing, founders, and directors to change small pieces of copy, hero images, or CTA text — over and over again.*

The developer installs Dynamically locally (one-line install), models the page structure once (Page → Sections → Fields, ACF-style), and hands non-technical users a clean admin UI to edit content. The frontend consumes a REST/JSON API and renders dynamically — no more redeploys for a hero copy change.

**Tagline:** *"ACF for the Jamstack — without WordPress."*

**Primary deliverable of MVP:** A locally installable Node.js + Next.js application with a visual admin UI, schema builder (Pages → Sections → Fields), persistent storage, and a documented public REST API.

---

## 2. Problem Statement

### 2.1 The pain
Modern dev teams build marketing sites in Next.js / React. The site is fast, beautiful, and version-controlled. Then reality hits:

- **Day 1:** Marketing wants the hero headline rephrased.
- **Day 3:** Director wants the CTA button color and label changed.
- **Day 5:** A new ad campaign needs different hero copy, images, and testimonials for two days.
- **Day 7:** Revert it.

Every change = developer time, code change, PR, deploy. This is the wrong abstraction.

### 2.2 Why existing tools don't fit well
| Tool | Why it falls short for this use case |
|---|---|
| **WordPress + ACF** | Heavy, PHP-based, security overhead, awkward for headless Next.js shops |
| **Contentful / Sanity / Strapi Cloud** | SaaS pricing, vendor lock-in, data lives off-prem, monthly costs |
| **Strapi (self-hosted)** | Powerful but heavy; complex setup; opinionated; overkill for a marketing site |
| **Markdown / MDX in repo** | Requires git/PR knowledge — non-technical users can't use it |
| **Hard-coded JSON files** | Requires redeploy for every change |

### 2.3 The gap Dynamically fills
A **lightweight**, **local-first**, **dev-friendly** content layer that:
- Installs in <60 seconds
- Lets the developer define schema in the UI (or via config later)
- Returns clean JSON via a stable API
- Lets non-developers edit content in a friendly admin UI
- Costs nothing to run (self-hosted) or has a flat license fee

---

## 3. Target Users & Personas

### 3.1 Primary persona — "The Builder Dev"
- **Role:** Freelance dev / agency dev / in-house frontend dev
- **Stack:** Next.js, React, Tailwind, Vercel/Netlify
- **Pain:** Tired of being a content-change service desk
- **Goal:** Install once, model schema, hand over admin URL to client
- **Tech literacy:** High

### 3.2 Secondary persona — "The Content Editor"
- **Role:** Marketing manager, founder, director, copywriter
- **Pain:** Has to Slack/email the dev for every tiny change
- **Goal:** Edit hero copy, swap an image, publish — without touching code
- **Tech literacy:** Low to medium (knows Notion, Google Docs, Canva)

### 3.3 Tertiary persona — "The Agency Owner"
- **Role:** Runs a small dev agency
- **Pain:** Each client = recurring small change requests eating margin
- **Goal:** Standardize content workflow across all client projects
- **Tech literacy:** High

---

## 4. Goals & Non-Goals

### 4.1 Goals (MVP)
- ✅ One-command local install (`npx dynamically init` or Docker)
- ✅ Visual schema builder: create Pages → Sections → Fields (ACF-style)
- ✅ Admin UI to edit content per page/section
- ✅ Public REST API to consume content from any frontend
- ✅ Authentication (admin login) + API key for frontend consumption
- ✅ Image / file uploads with local storage
- ✅ Field types: Text, Textarea, Rich Text, Number, Boolean, Image, URL, Select, Repeater, Group
- ✅ Draft vs Published states
- ✅ Export/import schema as JSON (for moving between environments)

### 4.2 Non-Goals (explicitly NOT in MVP)
- ❌ Multi-tenant cloud SaaS hosting (self-hosted only at MVP)
- ❌ Real-time collaboration (Google-Docs-style)
- ❌ Versioning / revisions history (post-MVP)
- ❌ Localization / i18n (post-MVP)
- ❌ Webhook system (post-MVP)
- ❌ Plugin / extension marketplace
- ❌ Built-in CDN for assets
- ❌ Visual page builder (drag-drop preview) — this is a *content* tool, not a page builder
- ❌ Native mobile apps

---

## 5. User Stories

### 5.1 Developer stories
- As a dev, I want to `npx create-dynamically-app` and get a running instance in <60s so I can start modeling content immediately.
- As a dev, I want to define a Page (`Home`) with Sections (`Hero`, `Features`, `Testimonials`) and each section's fields, so my editor can fill in content.
- As a dev, I want a stable REST endpoint like `GET /api/v1/pages/home` that returns clean JSON, so my Next.js `getStaticProps` can consume it.
- As a dev, I want to generate TypeScript types from my schema, so I get autocomplete in my Next.js code.
- As a dev, I want to export my schema as JSON and commit it to my repo, so I can recreate the schema in production.

### 5.2 Editor stories
- As a marketing editor, I want to log in to a clean admin UI and see a list of pages I can edit.
- As an editor, I want to click "Home" → "Hero" and edit the headline, subheadline, and CTA button text.
- As an editor, I want to upload a new hero image by drag-drop.
- As an editor, I want to save a draft and preview it before publishing.
- As an editor, I want to revert a change if I made a mistake (post-MVP, but draft/discard is in MVP).

### 5.3 Agency stories (post-MVP signals)
- As an agency owner, I want each client to have their own Dynamically instance so data is isolated.
- As an agency owner, I want one dashboard to see all my client instances (post-MVP, hosted offering).

---

## 6. Core Features (MVP Scope)

### 6.1 Schema Builder
The heart of the product. Inspired by ACF, but UI-first.

**Hierarchy:**
```
Project (1)
 └── Pages (N)         e.g., Home, About, Pricing
      └── Sections (N) e.g., Hero, Features, Testimonials
           └── Fields (N) e.g., headline, subheadline, ctaText, ctaUrl
```

**Operations:**
- Create / rename / delete Page
- Create / reorder / delete Section within a Page
- Create / reorder / delete Field within a Section
- Configure each field: type, label, key (slug), required, default value, validation (min/max length, regex)

### 6.2 Field Types (MVP)
| Type | Description | API output |
|---|---|---|
| `text` | Single-line text | `string` |
| `textarea` | Multi-line plain text | `string` |
| `richtext` | WYSIWYG (HTML or markdown) | `string` (HTML) |
| `number` | Integer or decimal | `number` |
| `boolean` | True/false toggle | `boolean` |
| `url` | Validated URL | `string` |
| `email` | Validated email | `string` |
| `image` | Upload single image | `{ url, width, height, alt }` |
| `file` | Upload any file | `{ url, filename, size, mime }` |
| `select` | Single choice from preset options | `string` |
| `multiselect` | Multiple choices | `string[]` |
| `color` | Hex color picker | `string` |
| `date` | Date picker | `ISO string` |
| `repeater` | Repeating group of fields (e.g., list of testimonials) | `Array<object>` |
| `group` | Nested group of fields | `object` |
| `relation` | Link to another Page (post-MVP, evaluate) | `string (page id)` |

### 6.3 Content Editor UI
- List view: all Pages
- Page detail: all Sections expanded as cards / accordion
- Each Section: form with all its Fields rendered with appropriate input components
- Save Draft / Publish buttons
- "Last edited by X at Y" indicator
- Search / filter pages

### 6.4 Public API
**Read endpoints (consumed by frontend):**
- `GET /api/v1/pages` — list all published pages (id, slug, title, updatedAt)
- `GET /api/v1/pages/:slug` — full content tree for one page (sections + fields, fully resolved)
- `GET /api/v1/pages/:slug?preview=true` — draft content (requires preview token)

**Read auth:** API key in `Authorization: Bearer <key>` header, OR public read mode (configurable per project).

**Admin endpoints (consumed by Dynamically's own UI):**
- `POST /api/admin/auth/login`
- CRUD for `/pages`, `/sections`, `/fields`, `/content`, `/uploads`
- Session-based auth (httpOnly cookie)

### 6.5 Authentication
**MVP:** Single admin user (set during install), plus invite-N additional editors with email + password.
- Roles: `admin` (full), `editor` (content only, no schema changes)
- Sessions via httpOnly cookies for the admin UI
- API keys (generated, revocable) for frontend consumption

### 6.6 Media / File Uploads
- Local filesystem storage (`./uploads/`) at MVP
- Served via `/uploads/:filename` route
- Image validation (max 10MB, common formats)
- Optional: simple resize on upload (thumbnail, medium, full) — *evaluate if MVP or post-MVP*

### 6.7 Installation & Setup
**Goal:** From zero to running admin UI in under 60 seconds.

```bash
npx create-dynamically-app my-content
cd my-content
npm run dev
# → opens http://localhost:3030/admin
# → first-run wizard creates admin user + API key
```

Or via Docker:
```bash
docker run -p 3030:3030 -v ./data:/data anmol1377/dynamically
```

### 6.8 Schema Export / Import
- Schema as portable JSON (`dynamically.schema.json`) — committable to git
- Content as separate JSON dump — for backups
- CLI: `dynamically export schema > schema.json`
- CLI: `dynamically import schema < schema.json`

This is critical: the dev models schema in dev, exports, imports in prod, then the editor fills content in prod.

---

## 7. Technical Architecture

### 7.1 High-level diagram
```
┌────────────────────────────────────────────────────────────────┐
│                  Dynamically (single Node process)             │
│                                                                │
│  ┌──────────────────┐         ┌──────────────────────────┐     │
│  │  Next.js Admin   │ ◄─────► │  Node.js API (Express/   │     │
│  │  UI (/admin)     │         │  Fastify) — REST + Auth  │     │
│  └──────────────────┘         └────────────┬─────────────┘     │
│                                            │                   │
│                                  ┌─────────▼──────────┐        │
│                                  │   SQLite (default) │        │
│                                  │   data.db          │        │
│                                  └────────────────────┘        │
│                                                                │
│                                  ┌────────────────────┐        │
│                                  │   ./uploads/       │        │
│                                  │   (local FS)       │        │
│                                  └────────────────────┘        │
└────────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS / API Key
                          │
              ┌───────────┴────────────┐
              │  Customer Frontend     │
              │  (Next.js / React /    │
              │   any consumer)        │
              └────────────────────────┘
```

### 7.2 Tech stack
| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 20+ LTS | Modern, widely available, async native |
| **Backend framework** | **Fastify** (preferred) or Express | Fastify is faster, better TS support; Express is more familiar — pick Fastify for MVP |
| **Frontend (admin UI)** | Next.js 14+ (App Router) | What user requested; SSR + great DX |
| **UI library** | shadcn/ui + Tailwind | Fast to build, looks polished, no design debt |
| **Form handling** | React Hook Form + Zod | Type-safe, performant |
| **Rich text editor** | Tiptap | Headless, extensible, good Next.js story |
| **Database** | **SQLite** (see §7.3) | Zero-config, perfect for local self-host |
| **ORM / DB layer** | Prisma or Drizzle | Both are great; Drizzle is lighter, Prisma has better DX. **Recommend Drizzle** for footprint |
| **Auth** | Lucia Auth or self-rolled JWT/session | Lucia is purpose-built for this |
| **File storage** | Local FS (MVP) → pluggable to S3 (post-MVP) | Simplest path |
| **Validation** | Zod (shared between frontend + backend) | Single source of truth for schemas |
| **Packaging** | npm package + Docker image | Both are needed |

### 7.3 Database choice — **SQLite for MVP**

You asked SQLite or MySQL. **My recommendation: SQLite for MVP, MySQL/Postgres as a future option.**

#### Why SQLite wins for this product
| Criterion | SQLite | MySQL |
|---|---|---|
| **Install friction** | Zero — file-based | Requires server install, user, port, config |
| **"Install locally and run"** UX | ⭐ Perfect fit | ❌ Adds 5 setup steps |
| **Backup** | Copy one file | mysqldump pipeline |
| **Performance for this workload** | Excellent (read-heavy, low-concurrency) | Overkill |
| **Hosting** | Anywhere | Needs DB host or container |
| **Marketing-site editing concurrency** | Plenty (single editor at a time, mostly) | More than needed |
| **Complexity** | One file | Network, users, schemas |

This product's workload — *a few editors per week, mostly reads from the public API* — is **squarely in SQLite's sweet spot**. SQLite happily serves apps with millions of reads/day and modest writes.

#### Migration path
- MVP: SQLite only
- v1.1+: Abstract DB layer behind ORM (Drizzle supports both) → add Postgres / MySQL adapters
- Self-hosted "team" tier: Postgres recommended (we'll guide users when they hit ~5+ concurrent editors)

#### Why not MySQL at MVP
- Hard to ask the user to install/configure a DB server just to edit page copy
- Backup story is harder
- Docker image becomes multi-container
- The performance gain is *zero* at MVP scale

**Decision: SQLite via better-sqlite3 driver, ORM via Drizzle.**

### 7.4 Repository structure
```
dynamically/
├── apps/
│   ├── admin/          # Next.js admin UI
│   └── api/            # Node.js API (Fastify)
├── packages/
│   ├── db/             # Drizzle schema + migrations
│   ├── shared/         # Shared types, Zod schemas
│   └── cli/            # `dynamically` CLI (init, export, import)
├── docker/
│   └── Dockerfile
└── package.json (workspaces / pnpm)
```

### 7.5 Data model (database schema)

```ts
// Conceptual — final shape may differ slightly

User {
  id, email, passwordHash, role ('admin' | 'editor'),
  createdAt, updatedAt
}

Project {
  id, name, slug, apiKey, settings (JSON),
  createdAt, updatedAt
}

Page {
  id, projectId, slug, title,
  status ('draft' | 'published'),
  createdAt, updatedAt
}

Section {
  id, pageId, slug, title, order, settings (JSON),
  createdAt, updatedAt
}

Field {
  id, sectionId, slug, label, type, order,
  config (JSON: validation, defaults, options, repeaterChildren, etc.),
  createdAt, updatedAt
}

ContentValue {
  id, fieldId, pageVersion ('draft' | 'published'),
  value (JSON),  -- typed by field.type at read time
  updatedAt, updatedByUserId
}

Upload {
  id, filename, originalName, mime, size,
  width, height,  -- for images
  uploadedByUserId, createdAt
}

ApiKey {
  id, projectId, name, keyHash, scope ('read' | 'preview'),
  lastUsedAt, createdAt
}
```

**Key design choices:**
- `ContentValue` stores the actual content keyed to `Field` — flexible enough for any field type via JSON `value`
- `pageVersion` enum lets us cleanly separate draft/published (post-MVP we add full revisions)
- All schema changes (Page/Section/Field) are first-class records → schema is data, not code

---

## 8. API Design

### 8.1 Public read API (frontend consumes this)

#### `GET /api/v1/pages/:slug`
**Auth:** `Authorization: Bearer <api_key>` (or public if project is configured public)

**Response (200):**
```json
{
  "slug": "home",
  "title": "Home",
  "updatedAt": "2026-04-29T10:30:00Z",
  "sections": {
    "hero": {
      "headline": "Build sites your marketing team can edit",
      "subheadline": "Dynamic content for static sites — without WordPress",
      "ctaText": "Get started",
      "ctaUrl": "/signup",
      "backgroundImage": {
        "url": "/uploads/hero-bg-abc123.jpg",
        "width": 1920,
        "height": 1080,
        "alt": "Team collaborating"
      }
    },
    "features": {
      "title": "Why Dynamically",
      "items": [
        { "icon": "zap", "title": "Fast", "body": "..." },
        { "icon": "lock", "title": "Self-hosted", "body": "..." }
      ]
    }
  }
}
```

**Notes:**
- Section keys are the user-defined slugs
- Field values are typed per field config
- Repeater fields → arrays of objects
- Image fields → expanded objects with url + dimensions

#### `GET /api/v1/pages/:slug?preview=true`
- Requires preview API key
- Returns draft content (not yet published)
- Used for Next.js draft mode

### 8.2 Admin API (Dynamically's own UI)
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET/POST/PATCH/DELETE /api/admin/pages`
- `GET/POST/PATCH/DELETE /api/admin/pages/:id/sections`
- `GET/POST/PATCH/DELETE /api/admin/sections/:id/fields`
- `GET/PATCH /api/admin/pages/:id/content`
- `POST /api/admin/uploads`
- `GET/POST /api/admin/api-keys`

### 8.3 Versioning
- All public endpoints prefixed `/api/v1/`
- Breaking changes → `/api/v2/` (post-MVP concern)

---

## 9. UI / UX Flows

### 9.1 First-run setup
1. User runs `npx create-dynamically-app`
2. App opens browser at `http://localhost:3030/setup`
3. Form: admin email, password, project name
4. Backend creates SQLite DB, runs migrations, creates admin user, generates initial API key
5. Redirect to `/admin/dashboard`
6. Empty state: "Create your first Page →"

### 9.2 Schema building flow (Developer)
1. `Pages` page → click "+ New Page" → enter slug `home`, title `Home`
2. Inside Page: click "+ Add Section" → enter slug `hero`, title `Hero Section`
3. Inside Section: click "+ Add Field" → modal with field type picker
4. Configure field (label, key, required, defaults)
5. Drag to reorder
6. Click "Copy API endpoint" → `GET /api/v1/pages/home`
7. Click "Generate TypeScript types" → downloads / copies typed interface

### 9.3 Content editing flow (Editor)
1. Login at `/admin`
2. See list of Pages
3. Click `Home` → see all Sections expanded as cards
4. Edit fields inline (text inputs, image uploaders, etc.)
5. "Save Draft" or "Publish"
6. Toast: "Published. Your site will reflect changes within X seconds."
   *(Note: ISR/revalidation is the consuming app's responsibility — we'll document patterns)*

### 9.4 Information architecture
```
/admin
  /dashboard           — overview, recent activity
  /pages               — list all pages
  /pages/:slug/edit    — edit content
  /pages/:slug/schema  — edit schema (admin only)
  /media               — uploaded files browser
  /settings
    /general
    /api-keys
    /users
    /export-import
```

---

## 10. Authentication & Permissions

### 10.1 MVP roles
- **Admin** — Full access. Schema, content, users, API keys, settings.
- **Editor** — Content only. Cannot modify schema or invite users.

### 10.2 Auth mechanisms
- **Admin UI:** Email + password → session cookie (httpOnly, SameSite=Lax)
- **Public API:** API keys in `Authorization: Bearer` header
- **Preview API:** Separate scoped API keys (read drafts)

### 10.3 Security baseline (MVP)
- Passwords hashed with argon2id
- Rate limiting on `/auth/login` (5 attempts / 15 min)
- API keys hashed at rest, shown once on creation
- CSRF protection on admin POSTs
- HTTPS strongly recommended in install docs
- No telemetry / phone-home

---

## 11. Deployment & Installation

### 11.1 Distribution channels (MVP)
1. **npm:** `npx create-dynamically-app` (CLI scaffolds + auto-runs)
2. **Docker:** `docker run anmol1377/dynamically` *(when published to Docker Hub)*
3. **Source:** Clone repo + `pnpm install && pnpm dev`

### 11.2 Hosting recommendations (documented for users)
- **Easiest:** Railway / Render / Fly.io (one-click deploy buttons)
- **Self-managed:** Any VPS (DigitalOcean, Hetzner) + reverse proxy
- **NOT supported at MVP:** Vercel/Netlify (these are stateless; SQLite + uploads need persistent disk)

### 11.3 Environment configuration
```
PORT=3030
DATABASE_URL=file:./data.db
UPLOAD_DIR=./uploads
SESSION_SECRET=<random>
NODE_ENV=production
PUBLIC_URL=https://content.example.com
```

---

## 12. Success Metrics (MVP)

### 12.1 Activation metrics
- **Time to first API call** — from `npm install` to successful `GET /api/v1/pages/x`. Target: **< 5 minutes**
- **Time to first published content edit** — from install to editor saving content. Target: **< 10 minutes**

### 12.2 Adoption metrics
- npm weekly downloads
- Docker image pulls
- GitHub stars (proxy for dev mindshare)

### 12.3 Quality metrics
- p95 API response time on `GET /api/v1/pages/:slug` < 50ms (in-memory cache target)
- Zero data-loss bugs in first 90 days
- < 5% of installs report a setup failure

### 12.4 Qualitative
- "Replaces ACF for us" — explicit testimonial
- "Marketing stopped pinging me" — explicit testimonial
- 5 paying customers within 3 months of v1 launch

---

## 13. Pricing & Business Model (early thinking — to validate)

### 13.1 Open core model
- **Open source / free:** Self-hosted, single-project, all field types, 3 editors max
- **Pro license (paid):** Unlimited editors, multi-project per instance, premium field types (relation, conditional fields), priority support, $99–199/year per instance
- **Cloud (post-MVP):** Hosted offering for those who don't want to self-host. $19/mo starter

*Validate with 10 dev interviews before locking pricing.*

---

## 14. Future Roadmap (Post-MVP, prioritized)

### v1.1 — Stabilization (1 month after MVP)
- Revisions / version history per content value
- Webhook system (notify on publish)
- TypeScript type generation CLI

### v1.2 — Power features (2 months)
- Localization (multi-locale per page)
- Conditional fields (show/hide based on another field's value)
- Relation field (cross-link pages)
- Search across content

### v1.3 — Scale & ergonomics (3 months)
- Postgres adapter
- S3-compatible upload backend
- Plugin API (custom field types)
- Schema-as-code (define schema in `.ts` files, sync both ways)

### v2.0 — Cloud offering
- Hosted multi-tenant SaaS
- Team workspaces
- Built-in CDN for uploads
- Auto-backups

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **"Why not just use Sanity/Strapi/Contentful?"** — competitive crowdedness | High | High | Lean hard into *local-first*, *zero-config*, *no monthly fees*. Position vs. Strapi as "lighter, more focused." |
| Self-hosting friction kills adoption | Medium | High | Invest in install UX. One-line install must actually work on Mac/Linux/Windows. Docker image. Pre-built Railway/Render templates. |
| Schema migrations get messy as users iterate | Medium | Medium | Make schema import/export a first-class feature from day 1. Document the dev→prod workflow. |
| SQLite hits limits | Low | Medium | Build DB layer behind ORM abstraction; have Postgres adapter shovel-ready. |
| Editors find UI confusing | Medium | High | Beta test with 5 non-technical editors before launch. UX > feature count. |
| Image handling complexity (resize, format conversion) | Medium | Medium | Start dumb (store as-is). Add Sharp-based resize in v1.1 if users ask. |
| Security incidents with self-hosted instances | Low | High | Ship secure defaults. Regular dependency audits. Clear deployment docs. |

---

## 16. Open Questions (need decisions / user input)

1. **Branding / naming:** Is "Dynamically" the final name? It's descriptive but there's a small npm package with the name. Worth checking trademark + npm namespace availability.
2. **Pricing:** Open-source MIT vs. open-core (BUSL/Elastic license)? This affects monetization path.
3. **Schema-as-code vs UI-only:** Should schema definitions live in JSON in the repo (committable, reviewable), in the DB (UI-editable), or **both** (sync)? *Leaning: both, with UI being the authoring surface and JSON as the export.*
4. **Multi-project per instance:** At MVP, support one project per install (simpler) or multi-project? *Leaning: single-project at MVP.*
5. **Frontend SDK:** Ship a `@dynamically/next` helper SDK at MVP, or just document the raw API? *Leaning: ship a tiny helper — `dynamically.getPage('home')` is much nicer than raw fetch.*
6. **Image transformations:** Include on-the-fly resize endpoint (`/uploads/x.jpg?w=400`) at MVP? Adds complexity. *Leaning: no, post-MVP.*
7. **License model for paid tier:** License key validated offline (better for self-host) vs. online (better for revocation)? *Leaning: offline JWT-based key.*
8. **Telemetry:** Anonymous opt-in usage telemetry to inform roadmap, or zero phone-home for trust? *Leaning: opt-in, off by default, very transparent.*
9. **Target frontend frameworks for SDK examples:** Next.js for sure. Also Astro, Remix, Nuxt, vanilla React/Vite? Prioritize.
10. **Rich text output format:** HTML (simpler, less portable) vs. Portable Text-style JSON (more flexible, needs renderer)? *Leaning: HTML at MVP, structured JSON post-MVP.*

---

## 17. Appendix

### 17.1 Glossary
- **Page** — A logical content unit, usually corresponding to a route on the consuming site (`/`, `/about`, `/pricing`).
- **Section** — A block within a Page (Hero, Features, FAQ, CTA).
- **Field** — A single piece of typed content within a Section (headline, image, button text).
- **Schema** — The structural definition of Pages → Sections → Fields. Editable by admins.
- **Content** — The actual values filled into the Schema. Editable by editors.
- **Project** — Top-level container in a multi-project deployment. MVP = 1 project per instance.

### 17.2 References / Inspiration
- ACF (Advanced Custom Fields) — primary inspiration for the field-builder UX
- Sanity Studio — schema-as-code patterns
- Strapi — self-hosted Node CMS reference architecture
- Tina CMS — local-first editing flow
- Notion — simplicity of editing UX

### 17.3 Document changelog
- **2026-04-29 v0.1** — Initial draft from product vision conversation.

---

*End of PRD v0.1*
