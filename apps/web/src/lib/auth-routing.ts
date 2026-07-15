export function sanitizeRedirect(
  value: unknown,
  origin = typeof window === 'undefined'
    ? 'http://localhost'
    : window.location.origin,
) {
  if (typeof value !== 'string' || !value) return '/'
  if (value.startsWith('/') && !value.startsWith('//')) return value

  try {
    const url = new URL(value, origin)
    if (url.origin !== origin) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
