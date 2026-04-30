# Dynamically — Technical Implementation Plan (MVP)

> **Status:** Draft v0.1
> **Companion to:** [PRD.md](PRD.md)
> **Last updated:** 2026-04-29

---

## 0. Decisions locked in (from PRD §16)

| # | Question | Decision |
|---|---|---|
| 1 | Multi-project? | **Single project per install** — no project scoping in routes or schema |
| 2 | Schema export/import? | **Out of scope for MVP** — schema lives only in the running instance |
| 3 | Frontend SDK? | **Yes** — ship `@anmollabs/dynamically-client` (framework-agnostic) + Next.js examples |
| 4 | License? | **MIT (fully open source)** |
| 5 | Rich text? | **HTML output via Tiptap** — simplest path, easy to render anywhere |

These decisions simplify the architecture meaningfully:
- No `Project` table — settings live in a singleton `Settings` row
- No export CLI / no portable JSON schema
- One npm package to maintain alongside the app: `@anmollabs/dynamically-client`

---

## 1. Final Tech Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Required minimum |
| Package manager | pnpm | 9.x | Workspaces support |
| Backend | Fastify | 4.x | Faster than Express, native TS, plugin ecosystem |
| Frontend | Next.js | 14 (App Router) | React 18+, Server Components |
| Language | TypeScript | 5.x | Strict mode everywhere |
| DB | SQLite via better-sqlite3 | latest | Single file, sync API (perfect for server) |
| ORM | Drizzle ORM | latest | Lighter than Prisma, SQL-first, great TS inference |
| Migrations | drizzle-kit | latest | Push & generate workflows |
| Auth | Lucia | v3 | Session-based, framework-agnostic |
| Password hashing | argon2 | latest | Memory-hard, modern default |
| Validation | Zod | 3.x | Shared between API + UI |
| UI components | shadcn/ui | latest | Tailwind-based, copy-paste |
| Styling | Tailwind CSS | 3.x | Utility-first |
| Forms | React Hook Form + Zod resolver | latest | Type-safe, performant |
| Rich text | Tiptap | 2.x | StarterKit + Image + Link extensions |
| File uploads (server) | @fastify/multipart | latest | Streaming uploads |
| Image processing | sharp | latest | Optional thumbnail generation |
| Drag-drop | dnd-kit | latest | For reordering sections/fields |
| Icons | lucide-react | latest | Pairs with shadcn |
| Logging | pino | latest | Fastify default |
| Testing | Vitest + Playwright | latest | Unit + E2E |

---

## 2. Repository Structure

Monorepo with pnpm workspaces — keeps the helper SDK alongside the app for shared types.

```
dynamically/
├── apps/
│   └── web/                      # Single Next.js app: admin UI + API routes
│       ├── app/
│       │   ├── (admin)/          # Protected admin UI routes
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/
│       │   │   ├── pages/
│       │   │   │   ├── page.tsx                  # list pages
│       │   │   │   └── [slug]/
│       │   │   │       ├── edit/page.tsx         # content editor
│       │   │   │       └── schema/page.tsx       # schema editor
│       │   │   ├── media/
│       │   │   ├── settings/
│       │   │   │   ├── api-keys/
│       │   │   │   ├── users/
│       │   │   │   └── general/
│       │   │   └── layout.tsx
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── setup/        # first-run wizard
│       │   ├── api/
│       │   │   ├── v1/           # PUBLIC API (consumed by frontend SDK)
│       │   │   │   └── pages/
│       │   │   │       ├── route.ts              # GET list
│       │   │   │       └── [slug]/route.ts       # GET single
│       │   │   ├── admin/        # ADMIN API (consumed by admin UI)
│       │   │   │   ├── auth/
│       │   │   │   ├── pages/
│       │   │   │   ├── sections/
│       │   │   │   ├── fields/
│       │   │   │   ├── content/
│       │   │   │   ├── uploads/
│       │   │   │   ├── api-keys/
│       │   │   │   └── users/
│       │   │   └── uploads/[filename]/route.ts   # serve uploads
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/               # shadcn components
│       │   ├── admin/            # admin-specific
│       │   │   ├── schema-builder/
│       │   │   ├── content-editor/
│       │   │   ├── field-renderers/   # one per field type
│       │   │   └── media-picker/
│       │   └── editors/
│       │       └── tiptap.tsx
│       ├── lib/
│       │   ├── db/               # Drizzle client + helpers
│       │   ├── auth/             # Lucia setup
│       │   ├── api/              # API key validation, etc.
│       │   ├── content/          # serialize/deserialize content
│       │   └── uploads/
│       ├── server/               # initialization, migrations runner
│       ├── public/
│       ├── data/                 # SQLite file lives here (.gitignored)
│       ├── uploads/              # uploaded media (.gitignored)
│       ├── drizzle.config.ts
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── db/                       # Drizzle schema + migration files
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   └── index.ts
│   ├── shared/                   # Shared Zod schemas + TS types
│   │   ├── field-types.ts
│   │   ├── api-types.ts
│   │   └── index.ts
│   └── client/                   # @anmollabs/dynamically-client — published to npm
│       ├── src/
│       │   ├── index.ts
│       │   └── next.ts           # Next.js helpers
│       ├── README.md
│       └── package.json
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── scripts/
│   ├── create-dynamically-app/   # the npx scaffolder
│   └── seed.ts
│
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
│
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── LICENSE                       # MIT
├── PRD.md
└── TECHNICAL_IMPLEMENTATION.md
```

**Why a single Next.js app for both admin UI and API:**
- Single process, single port, single deploy
- Next.js Route Handlers (`app/api/`) are perfectly capable for our load
- The decision point would be Fastify if we needed extreme performance — but for an editor's CMS, Next.js Route Handlers + better-sqlite3 will easily handle 1000s req/sec
- **Trade-off accepted:** dropping Fastify keeps the stack simpler. Revisit if profiling shows API latency issues.

> **Updated stack note:** swap Fastify out, use Next.js Route Handlers instead. One less moving part. PRD's recommendation of Fastify stands as a fallback if perf becomes an issue.

---

## 3. Database Schema (Drizzle)

```ts
// packages/db/schema.ts
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ───────── SETTINGS (singleton) ─────────
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(1), // enforce singleton via CHECK constraint
  siteName: text('site_name').notNull().default('My Site'),
  publicReadEnabled: integer('public_read_enabled', { mode: 'boolean' }).default(false),
  setupComplete: integer('setup_complete', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── USERS ─────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                    // cuid2
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor'] }).notNull().default('editor'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── SESSIONS (Lucia) ─────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

// ───────── PAGES ─────────
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),                    // cuid2
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── SECTIONS ─────────
export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),                   // unique within page
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── FIELDS ─────────
export const fields = sqliteTable('fields', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),                   // unique within section
  label: text('label').notNull(),
  type: text('type').notNull(),                   // 'text' | 'textarea' | 'richtext' | ...
  order: integer('order').notNull().default(0),
  config: text('config', { mode: 'json' }).$type<FieldConfig>().notNull().default({}),
  // config JSON:
  //   { required, defaultValue, helpText, validation, options (for select),
  //     children (for repeater/group), maxItems (for repeater), ... }
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── CONTENT VALUES ─────────
// One row per (field, version). Content is JSON shaped by field type.
export const contentValues = sqliteTable('content_values', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  version: text('version', { enum: ['draft', 'published'] }).notNull(),
  value: text('value', { mode: 'json' }).$type<unknown>(),  // typed by field.type at read time
  updatedByUserId: text('updated_by_user_id').references(() => users.id),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  fieldVersionUnique: { columns: [t.fieldId, t.version], unique: true },
}));

// ───────── UPLOADS ─────────
export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull().unique(),  // hashed: abc123.jpg
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),                        // null for non-images
  height: integer('height'),
  alt: text('alt').default(''),
  uploadedByUserId: text('uploaded_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ───────── API KEYS ─────────
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),   // sha256 of the key
  keyPrefix: text('key_prefix').notNull(),        // 'dyn_pub_' or 'dyn_prv_' + first 8 chars (display-only)
  scope: text('scope', { enum: ['read', 'preview'] }).notNull().default('read'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
```

### Notable design choices
- **All IDs are `cuid2`** — short, URL-safe, sortable-ish. No exposed integer counts.
- **Timestamps as Unix epoch integers** — SQLite-native, smaller, easy to compare.
- **`config` and `value` use JSON columns** — Drizzle's `mode: 'json'` handles serialization. SQLite's `JSON1` extension (built-in to better-sqlite3) lets us index into JSON if ever needed.
- **`contentValues` is keyed by `(fieldId, version)`** — clean separation of draft vs published; updating draft is a single upsert.
- **`uploads.filename` is hashed** — never use the user's original filename on disk (collisions, path traversal, weird chars).

### Indexes to add (post-migration)
```sql
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_sections_page ON sections(page_id, "order");
CREATE INDEX idx_fields_section ON fields(section_id, "order");
CREATE INDEX idx_content_field_version ON content_values(field_id, version);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

---

## 4. Field Type System

Field type definitions are centralized as a registry — adding a new type means adding one entry.

```ts
// packages/shared/field-types.ts
import { z } from 'zod';

export type FieldType =
  | 'text' | 'textarea' | 'richtext'
  | 'number' | 'boolean'
  | 'url' | 'email' | 'color' | 'date'
  | 'select' | 'multiselect'
  | 'image' | 'file'
  | 'repeater' | 'group';

export interface FieldDefinition {
  type: FieldType;
  label: string;                          // user-facing label in field-type picker
  configSchema: z.ZodSchema;              // validates field.config
  valueSchema: z.ZodSchema;               // validates content_values.value for this type
  defaultConfig: Record<string, unknown>;
  serializeForApi: (value: unknown, ctx: SerializeContext) => unknown;
  // ^ e.g., image type expands to { url, width, height, alt }
}

// Example: text field
export const textField: FieldDefinition = {
  type: 'text',
  label: 'Text',
  configSchema: z.object({
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    helpText: z.string().optional(),
    maxLength: z.number().optional(),
  }),
  valueSchema: z.string(),
  defaultConfig: { required: false },
  serializeForApi: (v) => v,
};

// Example: image field
export const imageField: FieldDefinition = {
  type: 'image',
  label: 'Image',
  configSchema: z.object({
    required: z.boolean().default(false),
    helpText: z.string().optional(),
    aspectRatioHint: z.string().optional(),  // e.g., "16:9", purely informational
  }),
  valueSchema: z.string().nullable(),         // stored as upload ID
  defaultConfig: { required: false },
  serializeForApi: async (uploadId, { db }) => {
    if (!uploadId) return null;
    const upload = await db.query.uploads.findFirst({ where: eq(uploads.id, uploadId) });
    if (!upload) return null;
    return {
      url: `/uploads/${upload.filename}`,
      width: upload.width,
      height: upload.height,
      alt: upload.alt,
    };
  },
};

// Example: repeater
export const repeaterField: FieldDefinition = {
  type: 'repeater',
  label: 'Repeater',
  configSchema: z.object({
    required: z.boolean().default(false),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
    children: z.array(/* recursive field config */),
  }),
  valueSchema: z.array(z.record(z.unknown())),  // array of { childSlug: value }
  defaultConfig: { required: false, children: [] },
  serializeForApi: async (items, ctx) => {
    if (!Array.isArray(items)) return [];
    return Promise.all(items.map((item) => serializeRepeaterItem(item, ctx)));
  },
};

// Field registry
export const FIELD_REGISTRY: Record<FieldType, FieldDefinition> = {
  text: textField,
  textarea: textareaField,
  richtext: richtextField,
  // ...
};
```

**Why this matters:** every field-rendering UI component and every API serializer can iterate the registry. Adding a new type later (e.g., `relation`) is a 3-step change: add to enum, write the definition, write the React renderer.

---

## 5. API Design (concrete)

### 5.1 Public API — `/api/v1/*`

#### `GET /api/v1/pages`
Auth: API key (read scope) OR public if `settings.publicReadEnabled = true`.
Query params: none.
Response:
```json
{
  "pages": [
    { "slug": "home", "title": "Home", "updatedAt": 1714390000 },
    { "slug": "about", "title": "About", "updatedAt": 1714000000 }
  ]
}
```
Only published pages.

#### `GET /api/v1/pages/:slug`
Auth: API key.
Query: `?preview=true` requires preview-scope key, returns draft content instead.
Response: full nested tree (see PRD §8.1 example).

**Caching:** Public API responses get an in-memory LRU cache (5 min TTL), keyed by `slug+version`. Invalidated on publish.

### 5.2 Admin API — `/api/admin/*`

All endpoints require valid session cookie. Mutations require role ≥ `editor`; schema endpoints require `admin`.

```
Auth
  POST   /api/admin/auth/login            { email, password } → 200 + Set-Cookie
  POST   /api/admin/auth/logout
  GET    /api/admin/auth/me
  POST   /api/admin/setup                 first-run only; idempotent guard

Pages (schema + content listing)
  GET    /api/admin/pages
  POST   /api/admin/pages                 { slug, title }
  GET    /api/admin/pages/:id             includes sections + fields + draft content
  PATCH  /api/admin/pages/:id             { title?, status?, order? }
  DELETE /api/admin/pages/:id
  POST   /api/admin/pages/:id/publish     copies draft → published

Sections
  POST   /api/admin/pages/:pageId/sections
  PATCH  /api/admin/sections/:id
  DELETE /api/admin/sections/:id
  POST   /api/admin/sections/reorder      { pageId, orderedIds: [...] }

Fields
  POST   /api/admin/sections/:sectionId/fields
  PATCH  /api/admin/fields/:id
  DELETE /api/admin/fields/:id
  POST   /api/admin/fields/reorder        { sectionId, orderedIds: [...] }

Content
  PATCH  /api/admin/content               { pageId, values: { [fieldId]: value, ... } }
                                          updates draft only
  POST   /api/admin/content/discard-draft { pageId }

Uploads
  POST   /api/admin/uploads               multipart, returns { id, url, width, height }
  GET    /api/admin/uploads               paginated list
  DELETE /api/admin/uploads/:id
  PATCH  /api/admin/uploads/:id           { alt }

API keys
  GET    /api/admin/api-keys
  POST   /api/admin/api-keys              { name, scope } → returns plaintext key ONCE
  DELETE /api/admin/api-keys/:id

Users
  GET    /api/admin/users                 admin only
  POST   /api/admin/users                 admin only — invite/create
  PATCH  /api/admin/users/:id
  DELETE /api/admin/users/:id
```

### 5.3 Public uploads
- `GET /uploads/:filename` — streams file from disk, sets `Cache-Control: public, max-age=31536000, immutable`
- This is a public route by design (URLs are unguessable hashes).

### 5.4 Error contract (consistent shape)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```
HTTP codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limit, 500 internal.

---

## 6. Authentication Flow

### 6.1 First-run setup
1. App boots → checks `settings.setup_complete`.
2. If `false`: every route redirects to `/setup`.
3. Setup form: email, password, confirm password.
4. `POST /api/admin/setup` (idempotent — fails if `setup_complete = true`):
   - hashes password (argon2id),
   - inserts `users` row (role: `admin`),
   - sets `settings.setup_complete = true`,
   - creates Lucia session,
   - sets session cookie.
5. Redirect to `/admin/dashboard`.

### 6.2 Login
- `POST /api/admin/auth/login` — argon2id verify → Lucia session → httpOnly cookie.
- Rate limit: 5 attempts / 15 min per IP+email.

### 6.3 API key validation (public API)
```ts
// pseudo
const header = req.headers.authorization?.replace('Bearer ', '');
if (!header) return 401;
const hash = sha256(header);
const key = await db.query.apiKeys.findFirst({ where: eq(apiKeys.keyHash, hash) });
if (!key) return 401;
if (preview && key.scope !== 'preview') return 403;
await db.update(apiKeys).set({ lastUsedAt: now() }).where(eq(apiKeys.id, key.id));
```

---

## 7. Frontend Helper SDK — `@anmollabs/dynamically-client`

```ts
// packages/client/src/index.ts
export interface DynamicallyClientOptions {
  baseUrl: string;          // e.g., "http://localhost:3030" or "https://content.acme.com"
  apiKey: string;
  preview?: boolean;
  fetch?: typeof fetch;     // override for SSR contexts
}

export class DynamicallyClient {
  constructor(private opts: DynamicallyClientOptions) {}

  async getPages(): Promise<PageSummary[]> { /* ... */ }
  async getPage<T = PageContent>(slug: string): Promise<T> { /* ... */ }
}

export function createClient(opts: DynamicallyClientOptions) {
  return new DynamicallyClient(opts);
}
```

```ts
// packages/client/src/next.ts — Next.js helper
import { createClient } from './index.js';

export function dynamicallyForNext() {
  return createClient({
    baseUrl: process.env.DYNAMICALLY_URL!,
    apiKey: process.env.DYNAMICALLY_API_KEY!,
    preview: process.env.DYNAMICALLY_PREVIEW === 'true',
  });
}
```

**Usage in customer's Next.js app:**
```ts
// app/page.tsx
import { dynamicallyForNext } from '@anmollabs/dynamically-client/next';

export default async function HomePage() {
  const client = dynamicallyForNext();
  const home = await client.getPage('home');
  return (
    <main>
      <h1>{home.sections.hero.headline}</h1>
      <p>{home.sections.hero.subheadline}</p>
    </main>
  );
}
```

**Caching strategy in SDK:**
- Internally uses `fetch` with `next: { revalidate: 60 }` when running on server
- ISR-friendly out of the box

---

## 8. Admin UI — Key Screens

### 8.1 Schema Builder (`/admin/pages/:slug/schema`)
Layout: left = section tree (drag-reorderable); right = section detail with fields list.
- Click a field → side drawer with field config form (label, key, type-specific options).
- "+ Add field" → modal with field-type picker (grid of icons + names from `FIELD_REGISTRY`).
- Repeater fields: nested fields config in same drawer (recursive).

### 8.2 Content Editor (`/admin/pages/:slug/edit`)
Layout: each section as a collapsible card; fields rendered inline using per-type renderers from a `FIELD_RENDERERS` map.
- Top bar: Save Draft (auto-save every 30s) | Discard Changes | Publish.
- "Publish" triggers diff modal: "Publishing 5 changes since last publish — proceed?".
- Sticky banner if draft differs from published: "You have unpublished changes."

### 8.3 Media library (`/admin/media`)
Grid of thumbnails. Click → side panel with details + alt text editor + delete.
Drag-drop upload zone. Used standalone or via the image-field picker.

### 8.4 Settings
- General: site name, public read toggle.
- API keys: create, copy-once, revoke.
- Users: list, invite, role.
- *No* "export schema" — explicitly out of scope per decision §0.

---

## 9. Implementation Milestones

Sized in days for one focused builder. Each milestone ends with something demoable.

### M1 — Foundation (3 days)
**Goal:** Empty Next.js app boots with DB, can create users.
- pnpm workspace setup, Next.js 14 App Router scaffold
- Drizzle schema + migrations runner
- Lucia auth + login page + setup wizard
- shadcn/ui installed, base layout
- `.env` handling, `data/` and `uploads/` directories
- **Demo:** Run `pnpm dev`, complete setup wizard, log in, see empty dashboard.

### M2 — Schema builder (4 days)
**Goal:** Can create pages, sections, fields via UI.
- Pages CRUD (list, create, rename, delete)
- Sections CRUD with drag-reorder (dnd-kit)
- Fields CRUD with field-type picker
- Field config drawer (per-type config form)
- `FIELD_REGISTRY` for: text, textarea, number, boolean, url, email, image, select
- **Demo:** Build a "Home" page with "Hero" section having headline + image.

### M3 — Content editing & publish (3 days)
**Goal:** Can fill in content and publish it.
- Content editor screen (renders fields per type)
- Field renderers for all M2 types
- Auto-save draft (debounced)
- Publish flow (draft → published copy in transaction)
- "Discard draft" action
- **Demo:** Edit hero copy, save draft, publish.

### M4 — Public API + SDK (2 days)
**Goal:** Frontend can fetch content.
- `GET /api/v1/pages` and `GET /api/v1/pages/:slug`
- API key creation UI + validation middleware
- Field serializers (image expansion, repeater nesting)
- In-memory LRU cache with publish-driven invalidation
- `@anmollabs/dynamically-client` package with `getPage` / `getPages`
- `@anmollabs/dynamically-client/next` with env-var-driven setup
- Example Next.js consumer app in `examples/`
- **Demo:** Curl the API, then run example Next.js app and see real content.

### M5 — Media + remaining field types (2 days)
**Goal:** Image uploads work end-to-end. Rich text + repeater work.
- `POST /api/admin/uploads` (multipart, sharp for dimensions)
- Media library page
- Image field renderer with picker
- Tiptap richtext field (StarterKit + Image + Link)
- Repeater field (recursive renderer)
- Group field
- Color, date, multiselect
- **Demo:** Hero with image, FAQ section as repeater, blog page with rich text body.

### M6 — Polish & ship (2 days)
**Goal:** It's installable.
- `create-dynamically-app` scaffolder script (npx)
- Dockerfile + docker-compose
- README with quick start
- Settings UI (general + users + API keys all polished)
- Rate limits, basic security headers
- Error pages, empty states, loading states
- One round of UX QA with someone non-technical
- **Demo:** From `npx create-dynamically-app` to published page in <5 min.

**Total: ~16 working days for a focused single builder.** Add ~30% buffer for bugs/UX iteration → **~20–22 days realistic.**

---

## 10. First Sprint Backlog (Week 1 — M1 + start of M2)

Concrete checklist you can start tomorrow:

- [ ] Init monorepo: `pnpm init`, `pnpm-workspace.yaml`, root tsconfig
- [ ] Create `apps/web` with Next.js 14 (`pnpm create next-app` with TS, App Router, Tailwind)
- [ ] Add shadcn: `pnpm dlx shadcn-ui@latest init`
- [ ] Install: `drizzle-orm better-sqlite3 drizzle-kit lucia @lucia-auth/adapter-drizzle argon2 zod react-hook-form @hookform/resolvers @dnd-kit/core @dnd-kit/sortable lucide-react`
- [ ] Create `packages/db` with `schema.ts`, set up `drizzle.config.ts`
- [ ] Wire `lib/db/index.ts` — singleton better-sqlite3 connection
- [ ] Migration runner that runs on app boot if `data.db` missing
- [ ] First migration: all tables from §3
- [ ] Lucia setup with Drizzle adapter
- [ ] `/setup` page + `POST /api/admin/setup` route handler
- [ ] `/login` page + `POST /api/admin/auth/login`
- [ ] Middleware: redirect unauth'd to login, redirect to /setup if not complete
- [ ] `/admin/dashboard` empty shell
- [ ] Pages list at `/admin/pages` with "+ New Page" form
- [ ] `POST/GET /api/admin/pages`

---

## 11. Coding Conventions

- **TypeScript strict mode** everywhere; no `any` except at well-marked boundaries.
- **Zod schemas live in `packages/shared/`** and are imported by both API handlers and forms.
- **Server-only modules:** anything touching DB or `process.env` lives under `lib/` and never imported from a client component.
- **Route handlers** wrap a thin auth/validation layer:
  ```ts
  export const POST = withAuth('admin', withValidation(createPageSchema, async (req, { user, body }) => {
    // ... business logic
  }));
  ```
- **No service layer for MVP.** Route handlers call Drizzle directly. Extract services only when logic gets reused or complex.
- **Error handling:** throw typed errors (`new HttpError(409, 'PAGE_SLUG_TAKEN')`), single catch in error middleware formats response.
- **No comments unless explaining non-obvious why.** Code names should carry intent.

---

## 12. Testing Strategy

- **Unit (Vitest):** field registry serializers, slug validation, auth helpers, content publish logic.
- **Integration (Vitest + supertest-style harness):** API routes with a temp SQLite file per test. Hit real Drizzle, real auth.
- **E2E (Playwright):** the golden flow — setup → create page/section/field → fill content → publish → fetch from public API. Run on CI.
- **No test for trivial CRUD wiring.** Test logic, not framework code.

---

## 13. Non-Functional Targets (MVP)

| Concern | Target |
|---|---|
| Cold boot to admin UI ready | < 3s |
| `GET /api/v1/pages/:slug` p95 | < 50ms (cached) / < 150ms (cold) |
| Memory footprint idle | < 200MB |
| DB file size with 50 pages, 200 fields, 1000 content values | < 10MB |
| Bundle size of admin UI (initial JS) | < 500KB gzipped |
| `@anmollabs/dynamically-client` bundle size | < 5KB gzipped |

---

## 14. Resolved Implementation Decisions

1. **Auto-save** content editor (debounced, ~1s after typing pause). Draft saves silently; explicit "Publish" still required.
2. **Slug edits warn but allow** — slug change breaks public API contract; show "this will break `/api/v1/pages/<old>`" warning, require confirmation.
3. **Hard delete** for pages, sections, fields. Cascade via `ON DELETE CASCADE`. Draft state is the safety net.
4. **Image variants:** deferred to post-MVP. Store originals only; document `/uploads/:filename?w=X` as a future endpoint.
5. **SDK types:** static `PageContent = { sections: Record<string, any> }` at MVP. Type generation post-MVP.
6. **Rate limiting:** per-IP for `/auth/login`, per-API-key for public API. Sensible defaults.
7. **Anonymous public read** — settings toggle (`settings.publicReadEnabled`). When true, public API endpoints work without API key. UI shows prominent warning when enabled.

---

## 15. Definition of Done — MVP

The MVP ships when **all** of these are true:

- ✅ A new user can run `npx create-dynamically-app` and reach a published page in < 5 minutes
- ✅ All field types from §4 work end-to-end (schema → editor → API)
- ✅ Public API returns correctly-shaped JSON consumable by the SDK
- ✅ Next.js example app fetches and renders content
- ✅ Basic security: hashed passwords, hashed API keys, CSRF on admin POSTs, rate-limited login
- ✅ E2E test of the golden flow passes in CI
- ✅ README with install + quick start + 30-second screencast
- ✅ MIT license file
- ✅ Published to npm: `create-dynamically-app`, `@anmollabs/dynamically-client`
- ✅ Docker image published

---

## 16. Document changelog

- **2026-04-29 v0.1** — Initial technical implementation plan, locked decisions from PRD §16.

---

*End of Technical Implementation Plan v0.1*
