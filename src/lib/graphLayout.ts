import type { Application, Point, Resource } from "@/types"
import { sortResources } from "@/lib/resources"

export const APP_NODE_SIZE = { width: 220, height: 84 } as const
export const RESOURCE_NODE_SIZE = { width: 212, height: 68 } as const

export interface RadialLayout {
  center: Point
  /** Node centres, in criticality order (most severe first). */
  members: { resource: Resource; position: Point }[]
}

/**
 * Places members evenly on a circle around the application, starting at
 * 12 o'clock and going clockwise in criticality order, so the most severe
 * resources always sit at the top. The radius grows with the member count
 * so neighbouring nodes keep roughly the same gap instead of overlapping.
 *
 * Pure and library-agnostic: React Flow only renders what this returns.
 */
export function radialLayout(app: Application, lookup: ReadonlyMap<string, Resource>): RadialLayout {
  const members = sortResources(
    app.resourceIds.flatMap((id) => {
      const r = lookup.get(id)
      return r ? [r] : []
    }),
    { key: "criticality", dir: "desc" },
  )

  const n = members.length
  // Arc length needed per node ≈ node width + gap; solve circumference = n * that.
  const minRadius = 230
  const perNode = RESOURCE_NODE_SIZE.width + 36
  const radius = Math.max(minRadius, (n * perNode) / (2 * Math.PI))

  return {
    center: { x: 0, y: 0 },
    members: members.map((resource, i) => {
      const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI
      return {
        resource,
        position: {
          x: Math.round(radius * Math.cos(angle)),
          // Squash vertically: the canvas is wider than tall.
          y: Math.round(radius * 0.72 * Math.sin(angle)),
        },
      }
    }),
  }
}
