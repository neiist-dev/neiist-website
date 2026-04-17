const isDev = process.env.NODE_ENV === "development";

const directives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'"],
  // TODO: add Cloudflare R2/CDN domain to img-src and connect-src when implemented
  "img-src": ["'self'", "data:", "blob:", "https://neiist.tecnico.ulisboa.pt"],
  "connect-src": ["'self'", "https://api.sumup.com", "https://gateway.sumup.com"],
  "frame-src": ["https://gateway.sumup.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  ...(!isDev ? { "upgrade-insecure-requests": [] } : {}),
};

export const CSP = Object.entries(directives)
  .map(([key, values]) => (values.length ? `${key} ${values.join(" ")}` : key))
  .join("; ");
