# Postman collection

Importable [Postman](https://www.postman.com/downloads/) collection for the Dynamically public API.

## Import

1. Open Postman → click **Import** (top left)
2. Drop in [`dynamically.postman_collection.json`](./dynamically.postman_collection.json) (or paste its contents into the Raw Text tab)
3. The collection appears in the sidebar as **Dynamically — Public API**

## Configure

Click the collection → **Variables** tab. Set:

| Variable | Example | Notes |
|---|---|---|
| `baseUrl` | `http://localhost:3030` | URL of your Dynamically instance |
| `apiKey` | `dyn_pub_2b54dce7…` | Read-scope key from Settings → API keys |
| `previewKey` | `dyn_prv_452847a2…` | Optional — only needed for the preview request |
| `pageSlug` | `home` | Default slug for the "Get a page" request |

> Set values in the **Current value** column (not just **Initial value**) — Postman uses that.

Save the collection (`Cmd+S`).

## Run

Six requests are included, split across both auth paths:

### With an API key

1. **List published pages** — `GET /api/v1/pages`
2. **Get a page by slug** — `GET /api/v1/pages/{{pageSlug}}`
3. **Get a page (preview / draft)** — `GET /api/v1/pages/{{pageSlug}}?preview=true` (uses `{{previewKey}}`)

### Without an API key

4. **Anonymous read (public mode on)** — same URL, no auth header. Returns 200 when **Settings → General → Allow anonymous public reads** is toggled ON. Use this if your frontend is a browser SPA that can't safely store a key.
5. **401 — missing key (public mode off)** — same URL, no auth header, but returns 401 when the toggle is OFF (the default).
6. **404 — unknown slug** — sanity check that 404s come back as JSON.

Click any request → **Send**.

## Auth scopes recap

- `dyn_pub_…` (read) — published content. Returns 403 if used with `?preview=true`.
- `dyn_prv_…` (preview) — also reads draft content. Use for preview routes.
- *no key* — works only when `publicReadEnabled = true` in admin Settings.

## Switching between with-key and anonymous

The collection-level auth is `Bearer {{apiKey}}`. The two no-auth requests override that to "no auth" individually — so you don't have to clear the key or change scope to test both paths.

To toggle anonymous mode: in the Dynamically admin UI go to **Settings → General**, check **"Allow anonymous public reads"**, save. Now request #4 returns 200; #5 still demonstrates the off state if you turn it back off.
