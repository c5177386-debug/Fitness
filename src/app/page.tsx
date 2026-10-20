import { permanentRedirect } from 'next/navigation';

/**
 * Root URL → 308 to /zh-CN.
 *
 * Layered guarantees (in descending priority):
 *   1. vercel.json redirect  → real HTTP 308 from Vercel Edge
 *   2. permanentRedirect()   → NEXT_REDIRECT instruction inside out/index.html
 *                               (Next.js static export cannot emit real
 *                                HTTP 308 for App Router pages; the HTML
 *                                fallback exists so the browser still
 *                                jumps even if layer 1 is misconfigured)
 */
export const metadata = {
  alternates: { canonical: '/zh-CN' },
};

export default function RootPage() {
  permanentRedirect('/zh-CN');
}
