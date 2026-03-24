/**
 * Extracts the hostname from a URL string.
 * Returns 'unknown' if the URL cannot be parsed.
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Normalizes a URL by stripping the fragment (#...) and trailing slash.
 * Returns the original string unchanged if it cannot be parsed.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const result = parsed.toString();
    // Strip trailing slash only from the pathname, not from origin-only URLs
    return result.endsWith('/') && parsed.pathname === '/'
      ? result.slice(0, -1)
      : result;
  } catch {
    return url;
  }
}
