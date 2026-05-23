const crypto = require('crypto');

/**
 * HIPAA-Compliant Security Headers Middleware
 * Implements Defense-in-Depth protections by injecting:
 * - Dynamic Content Security Policy (CSP) with cryptographically secure nonces
 * - X-Content-Type-Options: nosniff (Prevents MIME-sniffing)
 * - X-Frame-Options: DENY (Mitigates clickjacking)
 * - Referrer-Policy: no-referrer (Prevents PHI leakage in URL parameters)
 * - Strict-Transport-Security (Forces dynamic SSL/TLS connection)
 * - Permissions-Policy (Restricts browser hardware access)
 */
function securityHeaders(req, res, next) {
  // Generate a cryptographically secure 16-byte random base64 nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Attach the nonce to the request object so it can be injected into HTML templates if needed
  req.nonce = nonce;

  // 1. Content Security Policy (Strict, modern, and nonce-based to neutralize XSS)
  const cspDirective = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://res.cloudinary.com`,
    `connect-src 'self' https://api.mistral.ai https://api.pinecone.io https://generativelanguage.googleapis.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirective);

  // 2. Prevent MIME-Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 3. Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 4. Protect Referrer Leakage
  res.setHeader('Referrer-Policy', 'no-referrer');

  // 5. Enforce High-Security HTTPS Globally (HSTS - 1 year max-age, includes subdomains, preloaded)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 6. Hard Limit Hardware and Device API Access
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  // 7. Prevent Browser Caching of sensitive endpoint responses (HIPAA standard)
  if (req.path.startsWith('/api/verify') || req.path.startsWith('/api/history') || req.path.startsWith('/api/auth/me')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
}

module.exports = securityHeaders;
