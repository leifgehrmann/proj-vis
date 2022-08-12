// These variables are all defined by vite.config.ts.
// For whatever reason, they cannot be accessed within Vue files directly,
// so this module provides access to them.

export function getProjVisServerUrl (): string|null {
  // @ts-ignore
  const value = projVisServerUrl
  if (value === undefined || value === null || value === '' ) {
    return null
  }
  return value
}
