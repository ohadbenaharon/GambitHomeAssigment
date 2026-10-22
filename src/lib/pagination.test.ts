import { describe, expect, it } from "vitest"
import { paginate } from "@/lib/pagination"

const items = Array.from({ length: 23 }, (_, i) => i + 1)

describe("paginate", () => {
  it("slices the requested page", () => {
    expect(paginate(items, 1, 10)).toMatchObject({ items: items.slice(10, 20), from: 11, to: 20, pageCount: 3 })
  })

  it("handles a short last page", () => {
    expect(paginate(items, 2, 10)).toMatchObject({ items: [21, 22, 23], from: 21, to: 23 })
  })

  it("clamps an out-of-range page, e.g. after filtering shrinks the list", () => {
    expect(paginate(items.slice(0, 5), 4, 10)).toMatchObject({ page: 0, from: 1, to: 5 })
  })

  it("reports an empty list as one page with nothing in it", () => {
    expect(paginate([], 0, 10)).toMatchObject({ items: [], page: 0, pageCount: 1, from: 0, to: 0 })
  })
})
