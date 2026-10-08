/**
 * Site-wide public configuration.
 *
 * Values are inlined at build time (NEXT_PUBLIC_*), so set them before
 * `next build`. No trailing slash is kept on the origin — compose URLs
 * with `${SITE_URL}/${path}`.
 */
const FALLBACK_ORIGIN = 'https://fitness-calculators.com';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_ORIGIN
).replace(/\/+$/, '');

/** Contact address shown on the privacy-policy page (GDPR/CCPA requests) */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'privacy@fitness-calculators.com';

/** Build an absolute URL from a root-relative path (leading slash optional) */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}/${path.replace(/^\/+/, '')}`;
}
