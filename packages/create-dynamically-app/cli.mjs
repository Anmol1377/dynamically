#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const targetArg = args.find((a) => !a.startsWith('--'));

if (!targetArg || args.includes('-h') || args.includes('--help')) {
  process.stdout.write(usage());
  process.exit(targetArg ? 0 : 1);
}

const targetPath = resolve(process.cwd(), targetArg);
const projectName = basename(targetPath).toLowerCase().replace(/[^a-z0-9-]/g, '-');

async function main() {
  if (existsSync(targetPath)) {
    const s = await stat(targetPath).catch(() => null);
    if (s && s.isDirectory()) {
      const empty = (await import('node:fs').then((fs) => fs.readdirSync(targetPath))).length === 0;
      if (!empty) {
        console.error(`✗ Target directory ${targetPath} is not empty.`);
        process.exit(1);
      }
    } else if (s) {
      console.error(`✗ Target ${targetPath} exists and is not a directory.`);
      process.exit(1);
    }
  }

  const sourceTemplate = await locateTemplate();
  if (!sourceTemplate) {
    console.error(
      '✗ Could not locate the application template. ' +
        'In the dev monorepo, run from the package or set DYNAMICALLY_TEMPLATE_DIR.'
    );
    process.exit(1);
  }

  console.log(`→ Creating new Dynamically project at ${targetPath}`);
  console.log(`  source: ${sourceTemplate}`);

  await mkdir(targetPath, { recursive: true });
  await cp(sourceTemplate, targetPath, {
    recursive: true,
    force: true,
    filter: (src) => {
      const skip = ['node_modules', '.next', 'data', 'uploads', '.turbo', 'dist', 'tsbuildinfo'];
      return !skip.some((s) => src.includes(`/${s}`) || src.endsWith(`/${s}`));
    },
  });

  await rewritePackageJson(targetPath, projectName);
  await writeEnvFile(targetPath);
  await writeTopLevelReadme(targetPath, projectName);

  console.log('→ Installing dependencies (this can take a minute)…');
  await run(npmCommand(), ['install'], { cwd: targetPath });

  console.log('→ Running first migration…');
  await run(npmCommand(), ['run', 'db:migrate'], { cwd: targetPath });

  console.log('');
  console.log('✓ Done! Next:');
  console.log('');
  console.log(`    cd ${targetArg}`);
  console.log(`    ${npmCommand()} run dev`);
  console.log('');
  console.log('  Then open http://localhost:3030 to complete setup.');
}

async function locateTemplate() {
  if (process.env.DYNAMICALLY_TEMPLATE_DIR) return process.env.DYNAMICALLY_TEMPLATE_DIR;

  const bundled = join(__dirname, 'template');
  if (existsSync(bundled)) return bundled;

  const monorepoWeb = resolve(__dirname, '..', '..', 'apps', 'web');
  if (existsSync(monorepoWeb)) return monorepoWeb;

  return null;
}

async function rewritePackageJson(target, name) {
  const path = join(target, 'package.json');
  const raw = await readFile(path, 'utf-8');
  const pkg = JSON.parse(raw);
  pkg.name = name;
  pkg.version = '0.1.0';
  pkg.private = true;
  delete pkg.publishConfig;
  await writeFile(path, JSON.stringify(pkg, null, 2) + '\n');
}

async function writeEnvFile(target) {
  const path = join(target, '.env.local');
  if (existsSync(path)) return;
  const example = join(target, '.env.example');
  if (existsSync(example)) {
    await cp(example, path);
  }
}

async function writeTopLevelReadme(target, name) {
  const path = join(target, 'README.md');
  await writeFile(
    path,
    `# ${name}

A self-hosted [Dynamically](https://github.com/Anmol1377/dynamically) content instance.

## Run

\`\`\`bash
${npmCommand()} run dev
# → http://localhost:3030
\`\`\`

First boot opens the setup wizard.
`
  );
}

function npmCommand() {
  return process.env.npm_config_user_agent?.startsWith('pnpm') ? 'pnpm' : 'npm';
}

function run(cmd, args, opts) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function usage() {
  return `\nScaffold a new Dynamically content instance.\n\n  Usage: create-dynamically-app <target-dir>\n\n  Example:\n    npx create-dynamically-app my-content\n    cd my-content\n    npm run dev\n\n  Env:\n    DYNAMICALLY_TEMPLATE_DIR  Override the template source directory\n`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
