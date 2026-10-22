import { describe, expect, it } from "vitest"
import { INITIAL_URL_STATE, buildUrl, parseUrl, type UrlState } from "@/lib/urlState"

describe("parseUrl", () => {
  it("defaults to the first page of resources", () => {
    expect(parseUrl("/", "")).toEqual(INITIAL_URL_STATE)
  })

  it("reads the view, filters, sort and paging", () => {
    const s = parseUrl("/", "?q=auth&provider=GCP,AWS&env=staging&crit=low&sort=openIssues:asc&page=3&size=20")
    expect(s).toEqual({
      view: { kind: "resources" },
      filters: { query: "auth", provider: ["AWS", "GCP"], environment: ["staging"], criticality: ["low"] },
      sort: { key: "openIssues", dir: "asc" },
      page: 2,
      pageSize: 20,
    })
  })

  it("reads an application route, with or without a trailing slash", () => {
    expect(parseUrl("/applications/abc-123", "").view).toEqual({ kind: "application", id: "abc-123" })
    expect(parseUrl("/applications/abc-123/", "").view).toEqual({ kind: "application", id: "abc-123" })
  })

  it("drops anything it doesn't recognise instead of trusting the link", () => {
    const s = parseUrl("/nowhere", "?provider=AWS,Oracle,AWS&crit=extreme&sort=owner:up&page=-2&size=37")
    expect(s.view).toEqual({ kind: "resources" })
    expect(s.filters.provider).toEqual(["AWS"])
    expect(s.filters.criticality).toEqual([])
    expect(s.sort).toEqual(INITIAL_URL_STATE.sort)
    expect(s.page).toBe(0)
    expect(s.pageSize).toBe(10)
  })

  it("rejects page 0, non-numbers and absurd values", () => {
    for (const page of ["0", "two", "1.5", "99999999"]) {
      expect(parseUrl("/", `?page=${page}`).page).toBe(0)
    }
  })
})

describe("buildUrl", () => {
  it("omits defaults", () => {
    expect(buildUrl(INITIAL_URL_STATE)).toBe("/")
  })

  it("round-trips through parseUrl", () => {
    const s: UrlState = {
      view: { kind: "application", id: "a b/c" },
      filters: { query: "pay ments", provider: ["Azure"], environment: [], criticality: ["critical", "high"] },
      sort: { key: "name", dir: "asc" },
      page: 1,
      pageSize: 50,
    }
    const url = new URL(buildUrl(s), "http://x")
    expect(parseUrl(url.pathname, url.search)).toEqual(s)
  })

  it("keeps commas and colons readable", () => {
    expect(buildUrl({ ...INITIAL_URL_STATE, sort: { key: "name", dir: "asc" } })).toBe("/?sort=name:asc")
    expect(buildUrl({ ...INITIAL_URL_STATE, filters: { ...INITIAL_URL_STATE.filters, provider: ["AWS", "GCP"] } })).toBe(
      "/?provider=AWS,GCP",
    )
  })
})
