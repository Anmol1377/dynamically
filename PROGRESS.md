# Progress Tracker

> Companion to [TECHNICAL_IMPLEMENTATION.md](./TECHNICAL_IMPLEMENTATION.md). Shows milestone status and what's next.

## Current state — Shipped to all three registries 🚀

**The product is publicly published, installable, and self-hostable as of 2026-04-30.**

### Live artifacts

| Registry | Package | Tag |
|---|---|---|
| npm (SDK) | [`@anmollabs/dynamically-client`](https://www.npmjs.com/package/@anmollabs/dynamically-client) | `0.0.1` |
| npm (scaffolder) | [`create-dynamically-app`](https://www.npmjs.com/package/create-dynamically-app) | `0.0.3` |
| Docker Hub | [`anmol1377/dynamically`](https://hub.docker.com/r/anmol1377/dynamically) | `0.1.0`, `latest` (multi-arch: amd64 + arm64) |
| GitHub | [`Anmol1377/dynamically`](https://github.com/Anmol1377/dynamically) | `main` |

### Verified end-to-end (all from clean state, no source checkout)

- ✅ `npx create-dynamically-app my-cms` → install + migrate + run → setup wizard fires
- ✅ `docker compose up -d` (with compose file from raw GitHub URL) → migration runs → Next.js boots in 43ms → setup wizard fires → went through full setup successfully
- ✅ Multi-arch image (amd64 + arm64) on Docker Hub, pulls clean from registry
- ✅ SDK installs from npm in fresh dir, exports `DynamicallyClient` + `DynamicallyApiError`

### Docker publish workflow (for future releases)

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t anmol1377/dynamically:0.1.X \
  -t anmol1377/dynamically:latest \
  --push .
```

The `prepublishOnly` hooks in both npm packages handle SDK build + scaffolder template build automatically on `pnpm publish`.

### Bug fixes shipped during this milestone

- **`create-dynamically-app@0.0.2`** — cp filter excluded all template files when run from `node_modules` (`includes('/node_modules/')` matched the source path itself). Fixed by computing path relative to template root before checking skip list.
- **`create-dynamically-app@0.0.3`** — template's `tsconfig.json` extended `../../tsconfig.base.json` (monorepo path) which doesn't exist outside the monorepo. Fixed by inlining base config during template build.
- **Lazy SQLite init** in [`lib/db/client.ts`](apps/web/lib/db/client.ts) — module-level `new Database()` call broke Next.js page-data collection under qemu emulation in multi-arch Docker builds. Now uses a Proxy that opens the connection on first DB access.
- **`.dockerignore`** was excluding source dirs named `uploads/`/`data/` via overly-aggressive globs. Changed to explicit paths.
- **Migration runner** moved from TypeScript (`migrate.ts` + `tsx`) to esbuild-bundled `migrate.bundled.mjs` so the runtime image needs no extra deps install.

---

## Previous milestone — M6: Polish & ship ✅ DONE — MVP shippable

**Goal:** Make the project installable, hardened, and packaged.

### Done
- [x] **Login rate limit** — in-memory per (IP, email): 5 attempts / 15 min, cleared on success ([`lib/auth/rate-limit.ts`](apps/web/lib/auth/rate-limit.ts))
- [x] **Security headers** via `next.config.mjs`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`. CORS headers on `/api/v1/*` only
- [x] **Custom 404** at `app/not-found.tsx` — branded, with "Back to dashboard"
- [x] **Error boundaries** at `app/error.tsx` (root) and `app/(admin)/error.tsx` (admin segment) with retry
- [x] **Standalone Next.js build** (`output: 'standalone'`) — production server ships as ~5KB entrypoint + chunked deps
- [x] **Multi-stage Dockerfile** on `node:20-bookworm-slim` (deps / builder / runner). Runs migrations on every container start, then boots the standalone server. Volume mount at `/data` persists DB + uploads
- [x] **docker-compose.yml** with one named volume + sensible env defaults
- [x] **`.dockerignore`** — excludes node_modules, .next, local data/uploads, examples, git
- [x] **`create-dynamically-app` scaffolder** at [`packages/create-dynamically-app/`](packages/create-dynamically-app/) — `bin` field, template path resolution (env override → bundled → monorepo), copies `apps/web` to target, rewrites package.json, creates `.env.local`, runs install + db:migrate, prints next steps
- [x] **Polished README** — Docker quick-start as canonical install path, source install, scaffolder usage, SDK example, architecture, security baseline, full project layout

### Verified
- `pnpm typecheck` clean across all 3 workspaces
- `pnpm build` produces standalone output at `apps/web/.next/standalone/apps/web/server.js`
- Production server starts and serves admin UI on :3030
- All 5 security headers + 3 CORS headers present in HTTP responses
- Custom 404 renders for authenticated users hitting unknown routes
- API 404 returns the JSON `{ error: { code: 'NOT_FOUND', ... } }` shape
- Scaffolder `--help` works; template path resolution finds `apps/web` in the monorepo

### Definition of Done — final sweep
- ✅ A new user can scaffold + run in <5 min (Docker `up -d` or scaffolder)
- ✅ All 12 shipping field types work end-to-end (schema → editor → API). Repeater + group deferred to M5.5
- ✅ Public API returns correctly-shaped JSON consumable by the SDK
- ✅ Next.js example app fetches and renders content (image included)
- ✅ Basic security: argon2id passwords, SHA-256-hashed API keys, httpOnly+SameSite cookies, login rate limiting, security headers
- ✅ README with install + quick start (30s screencast still TODO post-ship)
- ✅ MIT license file
- 🟡 Published to npm — Docker is the primary install path. npm publish for `@anmollabs/dynamically-client` and `create-dynamically-app` is a one-command follow-up: `pnpm -r --filter './packages/*' publish`
- ✅ Docker image builds, runs migrations on boot, serves traffic

### Deferred to v1.1+
- Drag-reorder UI for sections/fields (data model + reorder actions are ready)
- Repeater + group field types (M5.5)
- Toast notifications (inline indicators today)
- E2E test in CI (Playwright)
- TypeScript codegen from schema
- LRU cache with publish-driven invalidation
- Per-API-key rate limiting

---

## Previous milestones

### M5: Media + extended field types ✅ DONE

**Goal:** Image uploads work end-to-end; rich text + remaining simple field types in.

### Done
- [x] `sharp` for image dimension probing; `@tiptap/{react,starter-kit,extension-link,pm}` for rich text
- [x] [`lib/uploads/store.ts`](apps/web/lib/uploads/store.ts) — multipart save with size/mime allowlist (10MB cap, jpg/png/webp/gif/svg/avif/pdf), random hex filenames, sharp metadata
- [x] [`POST /api/admin/uploads`](apps/web/app/api/admin/uploads/route.ts) — multipart endpoint, returns full upload row + URL
- [x] [`GET /uploads/[filename]`](apps/web/app/uploads/[filename]/route.ts) — streams file with `Cache-Control: public, max-age=31536000, immutable`
- [x] `/admin/media` page — dropzone + grid of thumbnails, click-through detail dialog with alt text editor + delete
- [x] `<UploadDropzone>` and `<ImagePickerDialog>` shared components (used by media page + image field renderer)
- [x] Image field renderer replaces the M3 stub: shows current image with mime/dimensions/alt, Change/Remove buttons, picker opens media library
- [x] API serializer expands image upload IDs to `{ url, width, height, alt }` — single batched query per request
- [x] Field registry extended: rich text, multiselect, color, date — registry entries + Zod config schemas + edit-field config UIs + renderers + API serializers
- [x] Tiptap rich text editor in [`components/editors/tiptap.tsx`](apps/web/components/editors/tiptap.tsx) — Bold/Italic/H1/H2/lists/quote/link/undo/redo toolbar, prose styling
- [x] Multiselect renderer as togglable chip group; color as native picker + hex input; date as native date input
- [x] Verified end-to-end: generated 800×450 JPG → uploaded via API → file on disk → DB row with dimensions → wired into hero.background → published → API returns `{url, width, height, alt}` → example app renders as full-bleed hero with overlaid card

### Verified
- Typecheck clean across web, client SDK, and example app
- POST upload returns 200 with metadata; uploaded file accessible via `/uploads/...` with correct cache headers
- Image field shows actual thumbnail in admin editor; picker shows library
- API: `home.sections.hero.background = { url, width: 800, height: 450, alt: "…" }`
- Example marketing site at :3001 displays the image as full-screen background with `hero-overlay` card

### Deferred to M5.5
**Repeater + group field types.** They're registered in `FIELD_REGISTRY` (so the schema is forward-compatible) but excluded from the visible field-type picker (`FIELD_TYPES`) until the recursive children-config UI is built. Adding them requires:
- A recursive children editor inside the Add/Edit Field dialog
- Recursive renderer (an item card per repeater entry)
- Recursive serializer (returns nested arrays/objects)

**Why defer:** half-day of UX iteration on the children editor; better to ship M5 polished than push everything together. No data-model migration needed when they land.

---

## Previous milestones

### M4: Public API + SDK ✅ DONE

**Goal:** A real frontend can fetch published content via a typed SDK. (Details preserved in earlier docs revisions; image was returning `null` from the serializer at this stage — M5 finished it.)

---

### M3: Content editing & publish ✅ DONE

**Goal:** Fill in content with debounced auto-save, then publish.

### Done
- [x] `loadPageContent()` — joined load of page + sections + fields + draft + published values, computes `hasUnpublishedChanges`
- [x] `saveDraftAction` — upserts only dirty fields into `content_values` (version='draft')
- [x] `publishPageAction` — wraps draft → published copy + `pages.status='published'` in a single SQLite transaction
- [x] `discardDraftAction` — deletes draft rows; editor falls back to published values
- [x] `/pages/[slug]/edit` route with full content editor
- [x] Auto-save: 1s debounce, dirty-diff so only changed fields hit the wire, queued to avoid concurrent writes
- [x] Save indicator: idle / unsaved / saving / saved Xs ago / save failed
- [x] Publish bar: status badge, save indicator, "unpublished changes" warning, Publish button (disabled while dirty), Discard with confirmation
- [x] Field renderers for text, textarea, number, boolean, url, email, select; image stubbed with M5 message
- [x] Pages list now links to `/edit` (the editor); schema page has "Edit content" cross-link; edit page has "Edit schema" cross-link
- [x] Verified end-to-end: empty → edit headline → save draft → publish → page.status flips → published == draft → discard removes draft → editor reads published

### Deferred to polish (M6)
- Toast notifications for publish / discard success
- Optimistic concurrency / "someone else is editing" detection
- Server-side validation of values against per-type config (maxLength etc.)

---

## Previous milestones

### M2: Schema Builder ✅ DONE

**Goal:** Can create pages, sections, and fields via UI.

### Done
- [x] Pages list at `/pages` with status badges, click-through to schema editor
- [x] Create page dialog (auto-slug from title, slug validation)
- [x] Rename + delete page (custom dropdown menu, confirmation modal)
- [x] Schema editor at `/pages/[slug]/schema` (page header + section cards)
- [x] Add/edit/delete sections with slug uniqueness within page
- [x] Add field — two-step dialog: type picker grid → label/key form
- [x] Edit field config drawer with per-type forms (defaults, min/max, options for select, etc.)
- [x] Delete field with confirmation
- [x] Field registry for M2 types: text, textarea, number, boolean, url, email, image, select
- [x] Server-side Zod validation on all create/update actions, type-specific config schemas
- [x] Hard-delete cascade verified (delete page → sections + fields gone)
- [x] 404 on unknown page slug
- [x] Demo data seeded: Home → Hero → headline (required text) + background (image)

### Deferred to polish (M6)
- Drag-reorder sections + fields (data model + reorder actions ready, UI TBD)
- Toasts for success/failure states (currently inline error text only)

---

## Previous milestones

### M1: Foundation ✅ DONE

**Goal:** Empty Next.js app boots with DB, can complete setup wizard, log in, see empty dashboard.

### Done
- [x] Workspace + root config (pnpm workspace, MIT license, .gitignore, .nvmrc)
- [x] PRD + Technical implementation plan locked
- [x] apps/web Next.js 14 scaffold (App Router, Tailwind, shadcn-style components)
- [x] Drizzle schema + first migration (9 tables: settings, users, sessions, pages, sections, fields, content_values, uploads, api_keys)
- [x] Auth: argon2id password hashing + SHA-256-keyed session table + httpOnly session cookie + middleware redirects
- [x] Setup wizard at `/setup` (one-time, gated by `settings.setup_complete`)
- [x] Login at `/login` (with `?redirect=` param support)
- [x] Admin layout (sidebar nav: Dashboard / Pages / Media / Settings + sign-out)
- [x] Empty dashboard at `/dashboard`
- [x] End-to-end verified: redirect chain correct, real session minted via DB, dashboard renders for authenticated user

### Verified
- Typecheck clean (`pnpm typecheck`)
- Dev server boots without warnings or errors
- `/` → `/setup` (when no setup) → after setup → `/login` → after auth → `/dashboard`
- SQLite WAL mode + foreign keys enforced, JSON columns shape-typed via Drizzle generics

---

## Milestones

| ID | Name | Status |
|---|---|---|
| M1 | Foundation | ✅ done |
| M2 | Schema builder | ✅ done |
| M3 | Content editing & publish | ✅ done |
| M4 | Public API + SDK | ✅ done |
| M5 | Media + extended field types | ✅ done |
| M5.5 | Repeater + group (recursive) | 🟡 deferred |
| M6 | Polish & ship | ⏳ pending |

---

## Decisions log

| Date | Decision |
|---|---|
| 2026-04-29 | Single project per install (no `Project` table — settings singleton) |
| 2026-04-29 | No schema export at MVP |
| 2026-04-29 | Ship `@anmollabs/dynamically-client` SDK |
| 2026-04-29 | MIT license |
| 2026-04-29 | Rich text via Tiptap, output as HTML |
| 2026-04-29 | Auto-save drafts (debounced ~1s) |
| 2026-04-29 | Hard delete (cascade) for pages/sections/fields |
| 2026-04-29 | Anonymous public-read toggle in settings |
| 2026-04-29 | Drop Fastify; use Next.js Route Handlers + Server Actions |
| 2026-04-29 | Session auth via `@oslojs/crypto` (no Lucia — deprecated) |
| 2026-04-29 | Password hashing via `@node-rs/argon2` |
