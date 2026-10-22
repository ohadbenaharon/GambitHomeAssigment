import { describe, expect, it } from "vitest"
import { STORAGE_KEY, deserialize, initialState, reducer, type StoreState } from "@/state/store"
import type { Application } from "@/types"

const app = (over: Partial<Application> = {}): Application => ({
  id: "a1",
  name: "Payments API",
  resourceIds: ["r-001", "r-002"],
  createdAt: "2026-10-21T00:00:00.000Z",
  ...over,
})

const withApp = (over?: Partial<Application>): StoreState => ({
  ...initialState,
  applications: [app(over)],
  layouts: { a1: { a1: { x: 0, y: 0 } } },
})

describe("reducer", () => {
  it("adds only resources that aren't members yet, and drops the saved layout", () => {
    const next = reducer(withApp(), { type: "app/addResources", id: "a1", resourceIds: ["r-002", "r-003"] })
    expect(next.applications[0]?.resourceIds).toEqual(["r-001", "r-002", "r-003"])
    expect(next.layouts).toEqual({})
  })

  it("ignores ids of resources that no longer exist, e.g. an Undo after a delete", () => {
    const next = reducer(withApp(), { type: "app/addResources", id: "a1", resourceIds: ["r-gone"] })
    expect(next.applications[0]?.resourceIds).toEqual(["r-001", "r-002"])
  })

  it("creates applications with existing resources only", () => {
    const next = reducer(initialState, { type: "app/create", app: app({ resourceIds: ["r-001", "r-gone"] }) })
    expect(next.applications[0]?.resourceIds).toEqual(["r-001"])
  })

  it("returns the same state when nothing new is added", () => {
    const state = withApp()
    expect(reducer(state, { type: "app/addResources", id: "a1", resourceIds: ["r-001"] })).toBe(state)
  })

  it("removes a member and drops the saved layout", () => {
    const next = reducer(withApp(), { type: "app/removeResource", id: "a1", resourceId: "r-001" })
    expect(next.applications[0]?.resourceIds).toEqual(["r-002"])
    expect(next.layouts).toEqual({})
  })

  it("renaming keeps membership and layout", () => {
    const next = reducer(withApp(), { type: "app/update", id: "a1", name: "Billing", description: "x" })
    expect(next.applications[0]).toMatchObject({ name: "Billing", description: "x", resourceIds: ["r-001", "r-002"] })
    expect(next.layouts.a1).toBeDefined()
  })

  it("deleting an application removes its layout", () => {
    const next = reducer(withApp(), { type: "app/delete", id: "a1" })
    expect(next.applications).toEqual([])
    expect(next.layouts).toEqual({})
  })

  it("updates a resource in place", () => {
    const first = initialState.resources[0]!
    const next = reducer(initialState, { type: "resource/update", resource: { ...first, openIssues: 9 } })
    expect(next.resources[0]?.openIssues).toBe(9)
    expect(next.resources).toHaveLength(initialState.resources.length)
  })
})

describe("resource/delete", () => {
  const state: StoreState = {
    ...initialState,
    applications: [app(), app({ id: "a2", name: "Other", resourceIds: ["r-003"] })],
    layouts: { a1: { a1: { x: 0, y: 0 } }, a2: { a2: { x: 0, y: 0 } } },
  }

  it("removes the resource from the inventory and from every application using it", () => {
    const next = reducer(state, { type: "resource/delete", id: "r-001" })
    expect(next.resources.some((r) => r.id === "r-001")).toBe(false)
    expect(next.applications[0]?.resourceIds).toEqual(["r-002"])
    expect(next.applications[1]?.resourceIds).toEqual(["r-003"])
  })

  it("resets layouts only for the affected applications", () => {
    const next = reducer(state, { type: "resource/delete", id: "r-001" })
    expect(Object.keys(next.layouts)).toEqual(["a2"])
  })

  it("restore puts it back in the inventory and its applications", () => {
    const resource = state.resources.find((r) => r.id === "r-001")!
    const deleted = reducer(state, { type: "resource/delete", id: "r-001" })
    const restored = reducer(deleted, { type: "resource/restore", resource, applicationIds: ["a1"] })
    expect(restored.resources).toHaveLength(state.resources.length)
    expect(restored.applications[0]?.resourceIds).toEqual(["r-002", "r-001"])
    expect(reducer(restored, { type: "resource/restore", resource, applicationIds: ["a1"] })).toBe(restored)
  })
})

describe("deserialize", () => {
  it("falls back to the seed for missing or corrupt data", () => {
    expect(deserialize(null)).toBe(initialState)
    expect(deserialize("{not json")).toBe(initialState)
    expect(STORAGE_KEY).toMatch(/v2$/)
  })

  it("drops invalid records and dangling references", () => {
    const raw = JSON.stringify({
      resources: [initialState.resources[0], { id: "bad", name: 3 }],
      applications: [app({ resourceIds: ["r-001", "r-999"] }), { id: "no-name" }],
      layouts: { a1: { a1: { x: 1, y: 2 }, junk: { x: "a" } }, ghost: { n: { x: 0, y: 0 } } },
    })
    const state = deserialize(raw)
    expect(state.resources.map((r) => r.id)).toEqual(["r-001"])
    expect(state.applications).toHaveLength(1)
    expect(state.applications[0]?.resourceIds).toEqual(["r-001"])
    expect(state.layouts).toEqual({ a1: { a1: { x: 1, y: 2 } } })
  })
})
