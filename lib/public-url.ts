/**
 * Public origin for server redirects. Behind a reverse proxy, `request.url` is
 * often the internal URL (e.g. http://127.0.0.1:3000), which breaks
 * `new URL(path, request.url)`.
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : "https";
    return `${proto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function publicRedirectUrl(request: Request, pathname: string): URL {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, `${getPublicOrigin(request)}/`);
}
