import { describe, expect, it } from "vitest"
import { seedResources as resources } from "@/data/resources"
import {
  EMPTY_FILTERS,
  filterResources,
  hasActiveFilters,
  highestCriticality,
  sortResources,
} from "@/lib/resources"
import { radialLayout } from "@/lib/graphLayout"

const resourcesById = new Map(resources.map((r) => [r.id, r]))
const names = (list: { name: string }[]) => list.map((r) => r.name)

describe("filterResources", () => {
  it("returns everything with no filters", () => {
    expect(filterResources(resources, EMPTY_FILTERS)).toHaveLength(resources.length)
  })

  it("matches the name case-insensitively and ignores surrounding whitespace", () => {
    const out = filterResources(resources, { ...EMPTY_FILTERS, query: "  AUTH-SERV " })
    expect(names(out)).toEqual(["auth-service-prod", "auth-service-staging"])
  })

  it("does not search other fields", () => {
    // "pci" appears only in tags and "identity" only as an owner.
    expect(filterResources(resources, { ...EMPTY_FILTERS, query: "pci" })).toEqual([])
    expect(filterResources(resources, { ...EMPTY_FILTERS, query: "identity" })).toEqual([])
  })

  it("ORs values within a facet", () => {
    const out = filterResources(resources, { ...EMPTY_FILTERS, provider: ["GCP", "Azure"] })
    expect(out.every((r) => r.provider !== "AWS")).toBe(true)
    expect(out).toHaveLength(6)
  })

  it("ANDs across facets and the query", () => {
    const out = filterResources(resources, {
      query: "payments",
      provider: ["AWS"],
      environment: ["production"],
      criticality: ["critical"],
    })
    expect(names(out)).toEqual(["payments-api-prod", "payments-db-prod"])
  })

  it("can return nothing", () => {
    const out = filterResources(resources, {
      ...EMPTY_FILTERS,
      provider: ["Azure"],
      criticality: ["critical"],
    })
    expect(out).toEqual([])
  })
})

describe("hasActiveFilters", () => {
  it("treats a whitespace query as inactive", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "   " })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, environment: ["staging"] })).toBe(true)
  })
})

describe("sortResources", () => {
  it("puts the most critical first, breaking ties by name", () => {
    const out = sortResources(resources, { key: "criticality", dir: "desc" })
    expect(names(out).slice(0, 4)).toEqual([
      "auth-service-prod",
      "auth-users-db",
      "payments-api-prod",
      "payments-db-prod",
    ])
    expect(out.at(-1)?.criticality).toBe("low")
  })

  it("sorts by open issues in both directions", () => {
    expect(sortResources(resources, { key: "openIssues", dir: "desc" })[0]?.name).toBe(
      "legacy-exports-public",
    )
    expect(sortResources(resources, { key: "openIssues", dir: "asc" })[0]?.openIssues).toBe(0)
  })

  it("sorts names A to Z ascending", () => {
    expect(sortResources(resources, { key: "name", dir: "asc" })[0]?.name).toBe("analytics-lake")
  })

  it("does not mutate its input", () => {
    const copy = [...resources]
    sortResources(resources, { key: "name", dir: "asc" })
    expect(resources).toEqual(copy)
  })
})

describe("highestCriticality", () => {
  it("returns the most severe level present", () => {
    expect(highestCriticality(resources.filter((r) => r.owner === "data"))).toBe("medium")
    expect(highestCriticality([])).toBeUndefined()
  })
})

describe("radialLayout", () => {
  const app = {
    id: "a",
    name: "Test",
    createdAt: "",
    resourceIds: ["r-012", "r-001", "missing", "r-003"],
  }

  it("skips unknown ids and orders members by criticality, first one at 12 o'clock", () => {
    const { members } = radialLayout(app, resourcesById)
    expect(members.map((m) => m.resource.id)).toEqual(["r-001", "r-003", "r-012"])
    expect(members[0]?.position.x).toBe(0)
    expect(members[0]?.position.y).toBeLessThan(0)
  })

  it("keeps every member at least the minimum distance from the centre", () => {
    const { members } = radialLayout(
      { ...app, resourceIds: resources.map((r) => r.id) },
      resourcesById,
    )
    for (const { position } of members) {
      expect(Math.hypot(position.x, position.y / 0.72)).toBeGreaterThanOrEqual(229)
    }
  })
})
