export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const SLUG_RE = /^[a-z][a-z0-9-]*$/;
export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s) && s.length <= 60;
}
