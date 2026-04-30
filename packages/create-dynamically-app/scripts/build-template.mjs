#!/usr/bin/env node
// Copies apps/web → packages/create-dynamically-app/template/
// so that the published npm package is self-contained.

import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const repoRoot = resolve(pkgRoot, '..', '..');
const sourceDir = join(repoRoot, 'apps', 'web');
const templateDir = join(pkgRoot, 'template');

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'data',
  'uploads',
  '.turbo',
  'dist',
]);

const SKIP_FILES = new Set([
  'next-env.d.ts',
  'tsconfig.tsbuildinfo',
  '.env.local',
]);

function shouldSkip(src) {
  const segments = src.split('/');
  for (const seg of segments) {
    if (SKIP_DIRS.has(seg)) return true;
  }
  const base = segments[segments.length - 1];
  if (SKIP_FILES.has(base)) return true;
  return false;
}

async function main() {
  console.log(`[build-template] cleaning ${templateDir}`);
  await rm(templateDir, { recursive: true, force: true });
  await mkdir(templateDir, { recursive: true });

  console.log(`[build-template] copying ${sourceDir} → ${templateDir}`);
  await cp(sourceDir, templateDir, {
    recursive: true,
    force: true,
    filter: (src) => !shouldSkip(src),
  });

  // Strip workspace-only fields from the template's package.json.
  const pkgPath = join(templateDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
  pkg.name = 'dynamically-instance';
  pkg.version = '0.1.0';
  pkg.private = true;
  delete pkg.publishConfig;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // Inline the monorepo's tsconfig.base.json so the scaffolded instance is
  // self-contained — the original template extends "../../tsconfig.base.json"
  // which doesn't exist outside the monorepo.
  const tsconfigPath = join(templateDir, 'tsconfig.json');
  const baseTsconfigPath = join(repoRoot, 'tsconfig.base.json');
  const baseTsconfig = JSON.parse(await readFile(baseTsconfigPath, 'utf-8'));
  const templateTsconfig = JSON.parse(await readFile(tsconfigPath, 'utf-8'));
  delete templateTsconfig.extends;
  templateTsconfig.compilerOptions = {
    ...baseTsconfig.compilerOptions,
    ...templateTsconfig.compilerOptions,
  };
  await writeFile(tsconfigPath, JSON.stringify(templateTsconfig, null, 2) + '\n');

  console.log(`[build-template] done`);
}

main().catch((err) => {
  console.error('[build-template] failed:', err);
  process.exit(1);
});
