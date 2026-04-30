# Publishing to npm — step-by-step

This repo ships **two** publishable packages:

| Package | What it is | Bin? |
|---|---|---|
| `@anmollabs/dynamically-client` | TypeScript SDK consumers install in their frontend | no |
| `create-dynamically-app` | `npx create-dynamically-app my-content` scaffolder | yes |

The publish flow is already wired up — you just need an npm account, the right scope, and three commands.

---

## Step 1 — npm account + scope

### 1.1 Make sure you have an npm account

```bash
npm whoami
# logs your username if signed in. If not:
npm login
```

### 1.2 The `@dynamically` scope

`@anmollabs/dynamically-client` is a **scoped** package. To publish it, you own the scope on npm. Three options:

**Option A — claim the scope as a free org (recommended)**

1. Go to https://www.npmjs.com/org/create
2. Create a free org named `dynamically`
3. Free orgs can publish public packages, just not private ones. Perfect for open source.

**Option B — use your personal scope**

Rename to `@<your-username>/client`. Edit `packages/client/package.json`:
```json
"name": "@anmolceparla/client"
```
Anyone can publish to their own personal scope (`@<your-username>/...`) without an org.

**Option C — drop the scope entirely**

Rename to `dynamically-client` (unscoped). First check the name's free:
```bash
npm view dynamically-client
# "404 Not Found" = available
```

`create-dynamically-app` is **unscoped**, so check that name too:
```bash
npm view create-dynamically-app
```

> If a name is taken on npm, the create command in step 4 will fail with `403 Forbidden`. Pick a different name and try again.

### 1.3 Update `homepage` / `repository` URLs

Both `package.json` files currently point at `https://github.com/dynamically/dynamically`. Change those to your real GitHub repo URL before publishing.

```bash
# Files to update:
packages/client/package.json
packages/create-dynamically-app/package.json
```

---

## Step 2 — Bump versions

For the very first publish, `0.0.1` is fine. For later releases:

```bash
# bump just the SDK
cd packages/client
npm version patch   # 0.0.1 → 0.0.2 (bug fixes)
npm version minor   # 0.0.1 → 0.1.0 (features)
npm version major   # 0.0.1 → 1.0.0 (breaking)

# bump the scaffolder
cd ../create-dynamically-app
npm version patch
```

Each of these:
- updates `version` in package.json
- creates a git commit `0.0.2` (if you're inside a git repo)
- creates a git tag `v0.0.2`

Skip git stuff with `--no-git-tag-version` if you're not ready.

---

## Step 3 — Dry run (always do this first)

Verify what will actually be published. **No data leaves your machine** — this just packs the tarball locally:

```bash
# SDK
cd packages/client
pnpm publish --dry-run

# Scaffolder
cd ../create-dynamically-app
pnpm publish --dry-run
```

Look at the output — it lists every file going into the tarball and the final size.

**The SDK should include:** `dist/index.{cjs,js,d.ts,d.cts}`, `dist/next.{cjs,js,d.ts,d.cts}`, sourcemaps, `src/`, `README.md`, `LICENSE`, rewritten `package.json` with `exports` pointing to `dist/`.

**The scaffolder should include:** `cli.mjs`, the full `template/` tree (~94 files: app, lib, components, scripts, configs), `README.md`, `LICENSE`.

If something looks wrong, `pnpm pack --pack-destination /tmp` saves the tarball locally and you can inspect with:

```bash
tar -tzf /tmp/dynamically-client-*.tgz
tar -xzOf /tmp/dynamically-client-*.tgz package/package.json | jq
```

---

## Step 4 — Publish

```bash
# SDK
cd packages/client
pnpm publish --access public

# Scaffolder
cd ../create-dynamically-app
pnpm publish --access public
```

`pnpm publish` automatically:
- Runs the `prepublishOnly` script (build SDK / build template) — already wired
- Applies `publishConfig` overrides (the SDK's `exports` get rewritten to point at `dist/`)
- Uploads to npm

`--access public` is required the first time you publish a scoped package. After that, npm remembers.

If you set up 2FA on npm (recommended), you'll be prompted for your one-time code.

---

## Step 5 — Smoke test the published packages

In a fresh directory (so it doesn't accidentally resolve to your local workspace):

```bash
# SDK
mkdir /tmp/test-sdk && cd /tmp/test-sdk
npm init -y
npm install @anmollabs/dynamically-client
node -e "const { createClient } = require('@anmollabs/dynamically-client'); console.log(createClient({ baseUrl: 'http://x' }))"

# Scaffolder
cd /tmp
npx create-dynamically-app@latest my-content
# should fully scaffold + install + migrate
```

If the SDK install fails with "package not found", give npm 30–60 seconds — the registry takes a moment to propagate after publish.

---

## Step 6 — Update the README

Once published, edit the main [README.md](./README.md):

- The "Heads-up: not yet published to npm" warning in section 2 → delete
- Re-promote `pnpm add @anmollabs/dynamically-client` to the primary install path (Option A → Option D)
- Replace the "node packages/create-dynamically-app/cli.mjs" path with `npx create-dynamically-app my-content`
- Update [`packages/client/README.md`](packages/client/README.md) install command if needed

---

## Troubleshooting

**`403 Forbidden` on publish** — name is taken or your account doesn't own the scope. Either rename the package or create the org/use your personal scope.

**`E402 Payment Required`** — you're trying to publish a *private* scoped package without a paid plan. Add `--access public` (already in the commands above).

**`E2FA` (one-time code required)** — enter your authenticator code when prompted. Setup once at https://www.npmjs.com/settings/<username>/profile.

**Build script didn't run** — `prepublishOnly` only runs on `npm publish` / `pnpm publish`, not on plain `pnpm pack`. If you're packing directly, run `pnpm build` first.

**SDK consumer can't find the package** — wait 30–60s after publish, then `npm view @anmollabs/dynamically-client` to confirm it's listed. CDN propagation lag is normal.

**Workspace example breaks after publishing** — shouldn't happen. The original `package.json` keeps `exports` pointing at `src/`; only the published tarball has `dist/` paths via `publishConfig`. If something's off, `rm -rf node_modules && pnpm install` to reset.

---

## What changes for subsequent releases

Once everything's published once, the loop is:

```bash
# Make changes, test, commit
cd packages/client
npm version patch     # bump
pnpm publish --access public

# Repeat for create-dynamically-app if its template changed too
```

**Important:** if you change the template inside `apps/web`, the scaffolder still ships the **last bundled `template/` directory**. Bump and republish `create-dynamically-app` whenever you want template changes to reach new instances.

---

## Optional — publish both at once

Add to root `package.json`:
```json
{
  "scripts": {
    "publish:all": "pnpm -r --filter './packages/*' publish --access public"
  }
}
```

Then `pnpm publish:all` runs both. **Use with care** — every time you run it, both packages publish (even if only one changed). Bumping versions thoughtfully matters more than batching the publishes.
