import { NextResponse } from 'next/server';

/**
 * Google Search Console verification endpoint.
 *
 * Served at /google-verification and rewritten to /google451d648a575a0feb.html
 * via vercel.json. The rewrite lets Vercel handle the URL mapping, which
 * bypasses any Next.js Route-Handler filename quirks around dots.
 *
 * Force-dynamic so Next.js skips static export for this handler — Vercel
 * will run it as an edge function and always serve fresh content.
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
