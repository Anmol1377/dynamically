# create-dynamically-app

Scaffold a new self-hosted [Dynamically](../../) content instance.

## Usage

```bash
npx create-dynamically-app my-content
cd my-content
npm run dev
# → http://localhost:3030 (first boot opens the setup wizard)
```

## What it does

1. Copies the Next.js + Drizzle + SQLite app template into the target directory.
2. Rewrites `package.json` with your project name.
3. Creates `.env.local` from the example.
4. Runs `npm install` and the initial database migration.
5. Prints next steps.

## Template source

The CLI looks for the template in this order:

1. `$DYNAMICALLY_TEMPLATE_DIR` if set
2. `./template/` bundled with the package (when installed via npm)
3. `../../apps/web` relative to the CLI script (when running from the monorepo)

## License

MIT
