import { NextResponse } from 'next/server';

/**
 * Google Search Console verification file.
 *
 * Why a Route Handler instead of public/:
 * Vercel's Next.js builder sometimes skips unusual public/ assets during
 * static deployment (images, _redirects, robots.txt get special treatment,
 * but random google*.html files don't). Emitting it via a handler guarantees
 * it is always present in the build output regardless of platform quirks.
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
