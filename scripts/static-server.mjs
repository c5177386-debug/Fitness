#!/usr/bin/env node
/**
 * Zero-dependency static server for the Next.js static export (`out/`).
 *
 * Why this exists:
 * - `next start` refuses to run when next.config has `output: 'export'`.
 * - Plain static servers answer `/` with 200 + a meta-refresh file, but
 *   the bare root must return a true 301 to `/zh-CN` (duplicate-content
 *   prevention).
 *
 * Usage:  node scripts/static-server.mjs        (PORT env, default 4000)
 *         npm start
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'out');
const PORT = Number(process.env.PORT) || 4000;
const ROOT_LOCALE = 'zh-CN';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

const handler = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    // ── Bare root: permanent redirect to the root-locale home ───────
    if (pathname === '/' || pathname === '') {
      const location = `/${ROOT_LOCALE}${url.search || ''}`;
      res.writeHead(308, { Location: location, 'Cache-Control': 'public, max-age=300' });
      res.end();
      return;
    }

    // ── Resolve inside ROOT only (block path traversal) ─────────────
    const safePath = normalize(pathname).replace(/^([./\\])+/, '');
    const filePath = join(ROOT, safePath);
    if (!filePath.startsWith(ROOT + sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // 1) exact file  2) clean URL → file + '.html'  3) dir → index.html
    let resolved = null;
    if (await isFile(filePath)) {
      resolved = filePath;
    } else if (await isFile(filePath + '.html')) {
      resolved = filePath + '.html';
    } else {
      const indexFile = join(filePath, 'index.html');
      if (await isFile(indexFile)) resolved = indexFile;
    }

    if (!resolved) {
      const body =
        (await readFile(join(ROOT, '404.html')).catch(() => null)) ?? 'Not Found';
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      });
      res.end(body);
      return;
    }

    const body = await readFile(resolved);
    res.writeHead(200, {
      'Content-Type': MIME[extname(resolved).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=300',
    });
    res.end(req.method === 'HEAD' ? null : body);
  } catch {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
};

function listenOnce(port, host) {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

// Bind IPv6 + IPv4 (a '::' socket often covers both via mapped addresses,
// in which case the second bind simply fails with EADDRINUSE and is skipped).
const hosts = process.env.HOST ? [process.env.HOST] : ['::', '0.0.0.0'];
const bound = [];
for (const host of hosts) {
  try {
    await listenOnce(PORT, host);
    bound.push(host);
  } catch (err) {
    if (err.code !== 'EADDRINUSE') throw err;
  }
}
if (bound.length === 0) {
  throw new Error(`port ${PORT} is already in use`);
}
console.log(`static on [${bound.join(', ')}]:${PORT} -> ${ROOT}`);
