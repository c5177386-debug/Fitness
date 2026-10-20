/**
 * Vercel serverless function.
 *
 * Serves the Google Search Console verification file at
 * /google451d648a575a0feb.html (mapped via vercel.json rewrite).
 *
 * Why not public/? Vercel's Next.js routing layer intercepts all
 * requests and ignores public/ files for unusual names like google*.html,
 * even though images work. A serverless function runs OUTSIDE Next.js
 * routing and always has priority.
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
  res.status(200).send('google-site-verification: google451d648a575a0feb.html\n');
}
