import { describe, expect, it } from "vitest"
import {
  EMPTY_RESOURCE_FORM,
  parseTags,
  toResourceInput,
  validateResourceForm,
  type ResourceFormValues,
} from "@/lib/resourceForm"

const valid: ResourceFormValues = {
  ...EMPTY_RESOURCE_FORM,
  name: "orders-queue",
  type: "SQS  Queue",
  region: "us-east-1",
  owner: "orders",
  tags: "Async, queue, async",
  openIssues: "3",
}
const never = () => false

describe("validateResourceForm", () => {
  it("accepts a complete form", () => {
    expect(validateResourceForm(valid, never)).toEqual({})
  })

  it("flags every required field on an empty form", () => {
    expect(Object.keys(validateResourceForm(EMPTY_RESOURCE_FORM, never)).sort()).toEqual(
      ["name", "owner", "region", "type"].sort(),
    )
  })

  it("rejects names with spaces and duplicate names", () => {
    expect(validateResourceForm({ ...valid, name: "orders queue" }, never).name).toMatch(/without spaces/)
    expect(validateResourceForm(valid, () => true).name).toMatch(/already exists/)
  })

  it("only accepts whole, non-negative issue counts", () => {
    for (const bad of ["-1", "1.5", "abc", "", "10000"]) {
      expect(validateResourceForm({ ...valid, openIssues: bad }, never).openIssues).toBeDefined()
    }
  })
})

describe("toResourceInput", () => {
  it("normalises whitespace, tags and the issue count", () => {
    expect(toResourceInput(valid)).toMatchObject({
      type: "SQS Queue",
      tags: ["async", "queue"],
      openIssues: 3,
    })
  })
})

describe("parseTags", () => {
  it("drops empties", () => {
    expect(parseTags(" , ,")).toEqual([])
  })
})
