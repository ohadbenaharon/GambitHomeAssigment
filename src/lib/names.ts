/** Collapses inner whitespace and trims, for display. */
export const cleanName = (name: string) => name.trim().replace(/\s+/g, " ")

/** Case- and whitespace-insensitive key, so "Payments API" and " payments  api" collide. */
export const normalizeName = (name: string) => cleanName(name).toLowerCase()
