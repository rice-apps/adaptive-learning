/**
 * Returns the canonical site origin for redirects. Use this instead of
 * request.url.origin in route handlers, as the latter can resolve to an
 * internal container origin (e.g. http://localhost:3000) when behind a
 * reverse proxy (e.g. Coolify).
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL or SITE_URL env var (canonical for production)
 * 2. request.url.origin (for local dev when env not set)
 * 3. http://localhost:3000 (last resort fallback)
 */
export function getSiteOrigin(request?: Request): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}
