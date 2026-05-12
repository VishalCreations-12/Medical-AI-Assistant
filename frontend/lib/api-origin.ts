/**
 * Browser: same-origin `/api/v1` (proxied by Next.js rewrites) unless NEXT_PUBLIC_API_URL is set.
 * Server: direct backend URL for any future SSR calls.
 */
export function getApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_SERVER_ORIGIN?.trim().replace(/\/$/, "") ??
    "http://127.0.0.1:8080"
  );
}
