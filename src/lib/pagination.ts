export const PAGE_SIZES = [10, 20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export interface Page<T> {
  items: T[]
  /** Zero-based, clamped into range, so a stale page index never shows an empty table. */
  page: number
  pageCount: number
  /** 1-based, inclusive, for "11–20 of 47". Both 0 when there are no items. */
  from: number
  to: number
  total: number
}

export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const safe = Math.min(Math.max(0, page), pageCount - 1)
  const start = safe * size
  const slice = items.slice(start, start + size)
  return {
    items: slice,
    page: safe,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
    total,
  }
}
