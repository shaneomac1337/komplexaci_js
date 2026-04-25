import { NextResponse, type NextRequest } from 'next/server';

// Hostile / dead URL families to surface as 410 Gone.
// 410 (vs 404) tells crawlers the resource is permanently gone, so Google
// drops it from the index much faster and stops re-crawling it.
const GONE_PATTERNS: RegExp[] = [
  /^\/wp-/i,                              // /wp-admin, /wp-content, /wp-includes, /wp-json, /wp-login.php, ...
  /^\/xmlrpc\.php$/i,
  /^\/(\.env|\.git|\.aws)([\/.]|$)/,      // .env, .env.bak, .env.local, .git/config, .aws/credentials, ...
  /\.php($|\?)/i,                         // any .php probe (we are a Next.js app, never serve PHP)
  /^\/_profiler(\/|$)/,                   // Symfony profiler probes
  /^\/actuator(\/|$)/,                    // Spring Boot actuator probes
  /^\/SDK\//,                             // Various device-SDK probes
];

// Routes we actually serve. Anything outside this set that survives the
// redirect/410 logic above is a real miss worth logging.
const KNOWN_ROUTES = new Set<string>([
  '/',
  '/cs2',
  '/league-of-legends',
  '/wwe-games',
  '/videotvorba',
  '/admin',
]);
const KNOWN_PREFIXES = ['/api/', '/auth/', '/admin/'];
const STATIC_FILE_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|json|webmanifest|txt|xml|map|woff2?|ttf)$/i;

function isKnown(pathname: string): boolean {
  if (KNOWN_ROUTES.has(pathname)) return true;
  if (KNOWN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_FILE_RE.test(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy Grav-era item pages — consolidate link equity onto /cs2 (the
  // closest live page, since these were Steam item / skin detail pages).
  if (/^\/items\/\d+\.html$/.test(pathname)) {
    return NextResponse.redirect(new URL('/cs2', req.url), 301);
  }

  // Old plain-HTML era root.
  if (pathname === '/index.html') {
    return NextResponse.redirect(new URL('/', req.url), 301);
  }

  // /favicon.ico → /favicon.png. We don't ship a .ico file; redirect once
  // and let browsers cache it.
  if (pathname === '/favicon.ico') {
    return NextResponse.redirect(new URL('/favicon.png', req.url), 301);
  }

  // Generic *.html → trim extension. Catches whatever stragglers we haven't
  // explicitly mapped. If the trimmed path doesn't exist, the user lands on
  // not-found.tsx (which logs the path so we can add a real redirect later).
  if (pathname.endsWith('.html')) {
    const stripped = pathname.replace(/\.html$/, '') || '/';
    return NextResponse.redirect(new URL(stripped, req.url), 301);
  }

  // Hostile bot probes.
  for (const pattern of GONE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, {
        status: 410,
        headers: { 'cache-control': 'public, max-age=86400' },
      });
    }
  }

  // Anything left that we don't recognize is almost certainly a 404. Log it
  // here (instead of in not-found.tsx) so we don't get false positives from
  // Next.js's dev-mode pre-evaluation of the not-found boundary, AND so
  // pages can stay statically rendered (no headers() call needed).
  if (!isKnown(pathname)) {
    const ref = req.headers.get('referer') ?? '';
    const ua = req.headers.get('user-agent') ?? '';
    console.log(
      `404 path=${JSON.stringify(pathname)} ref=${JSON.stringify(ref)} ua=${JSON.stringify(ua)}`,
    );
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and the static favicon image
  // (we don't want to add overhead to every static asset request).
  matcher: ['/((?!_next/static|_next/image|favicon\\.png).*)'],
};
