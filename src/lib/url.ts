function normalizeUrl(url: string) {
  const localUrl = /^(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(url);
  const withProtocol = /^https?:\/\//i.test(url) ? url : `${localUrl ? "http" : "https"}://${url}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(origin?: string | null) {
  const url =
    [
      origin,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL
    ].find((value): value is string => Boolean(value?.trim())) ?? "http://localhost:3000";

  return normalizeUrl(url);
}

export function getAbsoluteUrl(path = "/", origin?: string | null) {
  return new URL(path, `${getSiteUrl(origin)}/`).toString();
}
