# Anmol — Dynamically Run Guide

Practical command reference. Copy/paste in order; each section is independent.

---

## ⚠️ First time you run this — read this first

The DB shipped with this repo already contains test data from when the app was built and verified end-to-end:

- ✅ A seeded admin user (`test@example.com` / `password123`)
- ✅ Two API keys (one read, one preview)
- ✅ A "Home" page with a Hero section (headline + background image)
- ✅ One uploaded test image (the blue Dynamically banner)
- ✅ `setup_complete = true`

So when you boot the app, **you'll see the login page, not the setup wizard.** That's expected. Either log in as the seeded admin or wipe state — see below.

---

## 1. First-time setup (one-time)

```bash
cd /Users/cepl/Desktop/dynamically

# Install dependencies (pnpm workspaces)
pnpm install

# Create the SQLite DB and run all migrations
pnpm db:migrate
```

---

## 2. Run the admin (everyday dev)

```bash
cd /Users/cepl/Desktop/dynamically
pnpm dev
# → open http://localhost:3030
```

Stop with `Ctrl+C`.

### Option A — log in with the seeded admin (fastest)

```
Email:    test@example.com
Password: password123
```

You land on the dashboard with Home page + image already there. Good for poking around.

### Option B — fresh start (see the setup wizard)

Stop the dev server, then:

```bash
cd /Users/cepl/Desktop/dynamically/apps/web

# Nuke the DB and uploads
rm -f data/dynamically.db data/dynamically.db-*
rm -rf uploads && mkdir uploads

# Recreate empty schema and reboot
cd /Users/cepl/Desktop/dynamically
pnpm db:migrate
pnpm dev
```

Now http://localhost:3030 redirects to `/setup`.

---

## 3. Re-seed the test admin (without losing other data)

```bash
cd /Users/cepl/Desktop/dynamically/apps/web
pnpm tsx scripts/seed-test-admin.ts
# → creates test@example.com / password123 if missing, sets setup_complete = true
```

---

## 4. Try the public API

```bash
# Create a read-scope API key and capture it
cd /Users/cepl/Desktop/dynamically/apps/web
KEY=$(pnpm -s tsx scripts/seed-api-key.ts read "Test key" | tail -1)
echo $KEY

# List all published pages
curl -H "Authorization: Bearer $KEY" http://localhost:3030/api/v1/pages | jq

# Fetch one page's full content tree
curl -H "Authorization: Bearer $KEY" http://localhost:3030/api/v1/pages/home | jq
```

For preview/draft access:

```bash
PREVIEW_KEY=$(pnpm -s tsx scripts/seed-api-key.ts preview "Preview key" | tail -1)
curl -H "Authorization: Bearer $PREVIEW_KEY" "http://localhost:3030/api/v1/pages/home?preview=true" | jq
```

---

## 5. Run the example consumer site

```bash
# In a SECOND terminal — leave apps/web running on :3030 in the first
cd /Users/cepl/Desktop/dynamically/examples/next-marketing-site

# Paste the API key into .env.local
echo "DYNAMICALLY_URL=http://localhost:3030" >  .env.local
echo "DYNAMICALLY_API_KEY=$KEY"               >> .env.local

pnpm dev
# → http://localhost:3001 (renders content fetched from your Dynamically instance)
```

Edit a page in the admin (port 3030), hit Publish, refresh :3001 — content updates.

---

## 6. Useful checks while developing

```bash
# Type-check all 3 workspaces (run before committing)
cd /Users/cepl/Desktop/dynamically/apps/web && pnpm typecheck

# Production build — verifies standalone output works (used by Docker)
cd /Users/cepl/Desktop/dynamically && pnpm build

# Inspect SQLite directly
sqlite3 apps/web/data/dynamically.db ".tables"
sqlite3 apps/web/data/dynamically.db "SELECT slug, status FROM pages"
sqlite3 apps/web/data/dynamically.db "SELECT email, role FROM users"
sqlite3 apps/web/data/dynamically.db "SELECT name, scope, key_prefix FROM api_keys"

# Drizzle Studio — browse / edit DB in your browser
pnpm db:studio
```

---

## 7. Reset local state

```bash
cd /Users/cepl/Desktop/dynamically/apps/web

# Wipe the DB (forces setup wizard again next boot)
rm -f data/dynamically.db data/dynamically.db-*

# Wipe uploaded files
rm -rf uploads && mkdir uploads

# Recreate empty schema
cd /Users/cepl/Desktop/dynamically
pnpm db:migrate
```

---

## 8. Schema changes workflow

When you edit `apps/web/lib/db/schema.ts`:

```bash
cd /Users/cepl/Desktop/dynamically/apps/web

# Generate a new migration .sql file from your schema diff
pnpm db:generate

# Apply it to your local DB
cd /Users/cepl/Desktop/dynamically
pnpm db:migrate
```

Migration files land in `apps/web/lib/db/migrations/` — commit them.

---

## 9. Self-host with Docker

```bash
cd /Users/cepl/Desktop/dynamically

# Build + run (data + uploads persisted in a named volume)
docker compose up -d --build

# Tail logs
docker compose logs -f dynamically

# Stop
docker compose down

# Stop + nuke the data volume (clean slate)
docker compose down -v
```

After `up -d`, open http://localhost:3030 and complete the setup wizard.

---

## 10. Try the scaffolder

```bash
cd /Users/cepl/Desktop/dynamically

# Creates a fresh standalone instance at /tmp/my-content
node packages/create-dynamically-app/cli.mjs /tmp/my-content

# Then in that new directory:
cd /tmp/my-content && npm run dev
```

---

## 11. Most-likely next dev tasks

To add a new field type, touch these four files:

```bash
# Registry entry (icon, label, Zod config schema, default config)
apps/web/lib/fields/registry.ts

# Renderer in the content editor
apps/web/app/(admin)/pages/[slug]/edit/field-renderers.tsx

# API serializer case (how stored value → JSON output)
apps/web/lib/api/serialize.ts

# Per-type config UI in the schema editor
apps/web/app/(admin)/pages/[slug]/schema/edit-field-dialog.tsx
```

For other common changes:

```bash
# Add a new page in the admin
apps/web/app/(admin)/<your-route>/page.tsx

# Add a server action (mutations)
apps/web/app/(admin)/<your-route>/actions.ts

# Add a public API endpoint
apps/web/app/api/v1/<your-route>/route.ts
```

---

## 12. When something breaks

```bash
# Clear Next.js cache (fixes weird HMR/build state)
rm -rf apps/web/.next

# Reinstall everything (fixes most native binding / lockfile issues)
rm -rf node_modules apps/*/node_modules packages/*/node_modules examples/*/node_modules
pnpm install

# Rebuild native deps (better-sqlite3, sharp, argon2)
pnpm rebuild
```

---

## Suggested first 5 minutes

1. `cd /Users/cepl/Desktop/dynamically && pnpm install && pnpm db:migrate && pnpm dev`
2. Open http://localhost:3030 → log in as `test@example.com` / `password123`
3. Browse the existing Home page, Media library, Settings → API keys
4. Open a second terminal, run section 4 commands to curl the public API
5. Run section 5 to boot the example consumer at :3001 and see your content rendered

After that — start editing copy, uploading new images, creating new pages, and watch the API output update live.

---

## Documentation

- [README.md](./README.md) — public-facing intro + install
- [PRD.md](./PRD.md) — product requirements, personas, scope
- [TECHNICAL_IMPLEMENTATION.md](./TECHNICAL_IMPLEMENTATION.md) — architecture, schema, milestones, decisions
- [PROGRESS.md](./PROGRESS.md) — milestone tracker
