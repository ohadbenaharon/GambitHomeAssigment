import {
  CRITICALITIES,
  type Criticality,
  type Environment,
  type Provider,
  type Resource,
} from "@/types"

export interface ResourceFilters {
  query: string
  provider: Provider[]
  environment: Environment[]
  criticality: Criticality[]
}

export type FacetKey = "provider" | "environment" | "criticality"

export const EMPTY_FILTERS: ResourceFilters = {
  query: "",
  provider: [],
  environment: [],
  criticality: [],
}

export function hasActiveFilters(f: ResourceFilters): boolean {
  return (
    f.query.trim() !== "" ||
    f.provider.length > 0 ||
    f.environment.length > 0 ||
    f.criticality.length > 0
  )
}

/** An empty facet means "any value". */
function matchesFacet<T>(selected: readonly T[], value: T): boolean {
  return selected.length === 0 || selected.includes(value)
}

/**
 * OR within a facet, AND across facets. The query is a case-insensitive
 * substring match on the resource name, as the brief specifies.
 */
export function filterResources(
  list: readonly Resource[],
  f: ResourceFilters,
): Resource[] {
  const q = f.query.trim().toLowerCase()
  return list.filter(
    (r) =>
      (q === "" || r.name.toLowerCase().includes(q)) &&
      matchesFacet(f.provider, r.provider) &&
      matchesFacet(f.environment, r.environment) &&
      matchesFacet(f.criticality, r.criticality),
  )
}

export type SortKey = "name" | "criticality" | "openIssues"
export interface SortState {
  key: SortKey
  dir: "asc" | "desc"
}

/** Ascending is the natural order (A→Z, low→critical, 0→n); the default shows the worst first. */
export const DEFAULT_SORT: SortState = { key: "criticality", dir: "desc" }

export const criticalityRank = (c: Criticality): number =>
  CRITICALITIES.length - CRITICALITIES.indexOf(c)

const comparators: Record<SortKey, (a: Resource, b: Resource) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  criticality: (a, b) => criticalityRank(a.criticality) - criticalityRank(b.criticality),
  openIssues: (a, b) => a.openIssues - b.openIssues,
}

/** Stable sort with name as the tie-breaker so rows never jump around between renders. */
export function sortResources(list: readonly Resource[], s: SortState): Resource[] {
  const cmp = comparators[s.key]
  const sign = s.dir === "desc" ? -1 : 1
  return [...list].sort(
    (a, b) => sign * cmp(a, b) || a.name.localeCompare(b.name),
  )
}

export function highestCriticality(list: readonly Resource[]): Criticality | undefined {
  return CRITICALITIES.find((c) => list.some((r) => r.criticality === c))
}
