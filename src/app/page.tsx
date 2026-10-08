import { permanentRedirect } from 'next/navigation';

/**
 * Root URL — static export emits an HTML redirect file to the default
 * entry locale. `permanentRedirect` carries 308 semantics; a real HTTP 308
 * is emitted by scripts/static-server.mjs (and the hosting platform
 * configs: public/_redirects, vercel.json).
 */
export default function RootPage() {
  permanentRedirect('/zh-CN');
}
