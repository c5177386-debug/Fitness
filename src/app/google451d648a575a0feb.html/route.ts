import { NextResponse } from 'next/server';

/**
 * Google Search Console verification file.
 *
 * A Route Handler is the canonical way to emit arbitrary text files in
 * Next.js App Router. Under `output: 'export'` it prerenders into a
 * static file at /google451d648a575a0feb.html inside out/, alongside
 * the regular public/ copy. This mirrors how robots.ts and sitemap.ts
 * work, which Vercel serves correctly.
 *
 * The filename `google451d648a575a0feb.html` contains a dot — Next.js
 * still treats it as a valid route segment when placed directly under
 * app/ (dot-segments are accepted on the filesystem).
 */
export async function GET() {
  return new NextResponse('google-site-verification: google451d648a575a0feb.html\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  });
}

export const dynamic = 'force-static';
