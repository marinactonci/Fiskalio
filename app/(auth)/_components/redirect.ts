export const DEFAULT_AFTER_AUTH = "/dashboard";

/**
 * Resolves Clerk's `redirect_url` (set by the middleware when a protected page
 * bounces to sign-in) to a same-origin path; anything else falls back to the
 * dashboard so the param can't be used as an open redirect.
 */
export function resolveRedirect(raw: string | null): string {
  if (!raw || typeof window === "undefined") return DEFAULT_AFTER_AUTH;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return DEFAULT_AFTER_AUTH;
    if (
      url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/sso-callback")
    ) {
      return DEFAULT_AFTER_AUTH;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AFTER_AUTH;
  }
}
