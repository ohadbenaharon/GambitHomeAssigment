import { PAGE_SIZES, type PageSize } from "@/lib/pagination"
import { DEFAULT_SORT, EMPTY_FILTERS, type ResourceFilters, type SortKey, type SortState } from "@/lib/resources"
import { CRITICALITIES, ENVIRONMENTS, PROVIDERS } from "@/types"

/**
 * Everything that decides what's on screen lives in the URL, so a refresh, a
 * shared link or the back button lands in the same place:
 *
 *   /?q=auth&provider=AWS,GCP&env=production&crit=critical&sort=openIssues:desc&page=2&size=20
 *   /applications/<id>
 *
 * Defaults are left out to keep URLs short. Parsing is defensive: a link is
 * user input, so unknown values are dropped rather than trusted.
 */

export type View = { kind: "resources" } | { kind: "application"; id: string }

export interface UrlState {
  view: View
  filters: ResourceFilters
  sort: SortState
  /** Zero-based in state, one-based in the URL. */
  page: number
  pageSize: PageSize
}

export const DEFAULT_PAGE_SIZE: PageSize = 10

const SORT_KEYS: readonly SortKey[] = ["name", "criticality", "openIssues"]

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  const wanted = new Set(raw.split(","))
  // Canonical order, no duplicates, unknown values dropped.
  return allowed.filter((v) => wanted.has(v))
}

function parseSort(raw: string | null): SortState {
  const [key, dir] = (raw ?? "").split(":")
  if (SORT_KEYS.includes(key as SortKey) && (dir === "asc" || dir === "desc")) {
    return { key: key as SortKey, dir }
  }
  return DEFAULT_SORT
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (!raw || !/^\d{1,6}$/.test(raw)) return undefined
  const n = Number(raw)
  return n >= 1 ? n : undefined
}

export function parseUrl(pathname: string, search: string): UrlState {
  const params = new URLSearchParams(search)
  const appMatch = /^\/applications\/([^/]+)\/?$/.exec(pathname)

  const size = parsePositiveInt(params.get("size"))
  return {
    view: appMatch?.[1]
      ? { kind: "application", id: decodeURIComponent(appMatch[1]) }
      : { kind: "resources" },
    filters: {
      query: (params.get("q") ?? "").slice(0, 100),
      provider: parseList(params.get("provider"), PROVIDERS),
      environment: parseList(params.get("env"), ENVIRONMENTS),
      criticality: parseList(params.get("crit"), CRITICALITIES),
    },
    sort: parseSort(params.get("sort")),
    page: (parsePositiveInt(params.get("page")) ?? 1) - 1,
    pageSize: PAGE_SIZES.includes(size as PageSize) ? (size as PageSize) : DEFAULT_PAGE_SIZE,
  }
}

/**
 * The application view keeps the inventory's query string too, so going
 * "back to Resources" from an application restores the same filters and page.
 */
export function buildUrl(s: UrlState): string {
  const params = new URLSearchParams()
  const f = s.filters
  if (f.query.trim()) params.set("q", f.query)
  if (f.provider.length) params.set("provider", f.provider.join(","))
  if (f.environment.length) params.set("env", f.environment.join(","))
  if (f.criticality.length) params.set("crit", f.criticality.join(","))
  if (s.sort.key !== DEFAULT_SORT.key || s.sort.dir !== DEFAULT_SORT.dir) {
    params.set("sort", `${s.sort.key}:${s.sort.dir}`)
  }
  if (s.page > 0) params.set("page", String(s.page + 1))
  if (s.pageSize !== DEFAULT_PAGE_SIZE) params.set("size", String(s.pageSize))

  const path = s.view.kind === "application" ? `/applications/${encodeURIComponent(s.view.id)}` : "/"
  const query = params.toString().replaceAll("%2C", ",").replaceAll("%3A", ":")
  return query ? `${path}?${query}` : path
}

export const INITIAL_URL_STATE: UrlState = {
  view: { kind: "resources" },
  filters: EMPTY_FILTERS,
  sort: DEFAULT_SORT,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
}
