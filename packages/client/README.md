# @anmollabs/dynamically-client

Framework-agnostic client SDK for the [Dynamically](https://github.com/) content API.

## Install

```bash
pnpm add @anmollabs/dynamically-client
```

## Usage

### Plain JS / Node

```ts
import { createClient } from '@anmollabs/dynamically-client';

const client = createClient({
  baseUrl: 'http://localhost:3030',
  apiKey: 'dyn_pub_…',
});

const home = await client.getPage('home');
console.log(home.sections.hero.headline);
```

### Next.js (App Router)

```ts
// app/page.tsx
import { dynamicallyForNext } from '@anmollabs/dynamically-client/next';

export default async function HomePage() {
  const client = dynamicallyForNext();
  const home = await client.getPage('home');

  return (
    <main>
      <h1>{home.sections.hero.headline as string}</h1>
    </main>
  );
}
```

Set in `.env.local`:

```
DYNAMICALLY_URL=http://localhost:3030
DYNAMICALLY_API_KEY=dyn_pub_…
```

### Typed sections

Provide your own type for the `sections` object:

```ts
type HomeSections = {
  hero: { headline: string; subheadline: string };
};

const home = await client.getPage<HomeSections>('home');
home.sections.hero.headline; // string
```

### Preview / draft content

```ts
const client = createClient({
  baseUrl: '…',
  apiKey: 'dyn_prv_…',  // preview-scope key
  preview: true,
});
```

## API

### `createClient(options): DynamicallyClient`

Options:
- `baseUrl` (required) — your Dynamically instance URL.
- `apiKey` — Bearer token. Optional when the instance has anonymous public reads enabled.
- `preview` — fetch draft content instead of published. Requires a preview-scope key.
- `next.revalidate` — Next.js ISR window in seconds. Defaults to `60`.

### `client.getPages(): Promise<PageSummary[]>`

Lists all published pages.

### `client.getPage<T>(slug): Promise<PageContent<T>>`

Returns the full content tree for one page.

## Errors

Failed requests throw `DynamicallyApiError` with `.status` and `.code`.
