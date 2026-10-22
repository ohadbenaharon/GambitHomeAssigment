// Domain model. The union arrays are the single source of truth: the types are
// derived from them, and the UI iterates them to build filter menus and legends.

export const PROVIDERS = ["AWS", "GCP", "Azure"] as const
export type Provider = (typeof PROVIDERS)[number]

export const ENVIRONMENTS = ["production", "staging", "development"] as const
export type Environment = (typeof ENVIRONMENTS)[number]

/** Ordered from most to least severe, so index doubles as a sort rank. */
export const CRITICALITIES = ["critical", "high", "medium", "low"] as const
export type Criticality = (typeof CRITICALITIES)[number]

export interface Resource {
  id: string
  name: string
  /** Human-readable kind, e.g. "S3 Bucket", "IAM Role". */
  type: string
  provider: Provider
  region: string
  environment: Environment
  criticality: Criticality
  owner: string
  tags: string[]
  /**
   * Not in the brief's interface, but used by its sample record and required in
   * the table, so it's modelled explicitly rather than read off an untyped field.
   */
  openIssues: number
}

export interface Application {
  id: string
  name: string
  description?: string
  /** References only. Resources are looked up, never copied, so there's one source of truth. */
  resourceIds: string[]
  createdAt: string
}

export interface Point {
  x: number
  y: number
}
