// Normalizes a display name into a URL-safe, lowercase slug used for
// private per-user routes like /profile/{slug}.
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "") || "user";
}
