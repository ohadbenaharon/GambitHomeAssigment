import type { Criticality, Environment, Provider, Resource } from "@/types"

/** What the form edits: everything is a string except the closed unions. */
export interface ResourceFormValues {
  name: string
  type: string
  provider: Provider
  region: string
  environment: Environment
  criticality: Criticality
  owner: string
  tags: string
  openIssues: string
}

export type ResourceFormErrors = Partial<Record<keyof ResourceFormValues, string>>

export const EMPTY_RESOURCE_FORM: ResourceFormValues = {
  name: "",
  type: "",
  provider: "AWS",
  region: "",
  environment: "production",
  criticality: "medium",
  owner: "",
  tags: "",
  openIssues: "0",
}

export function toFormValues(r: Resource): ResourceFormValues {
  return { ...r, tags: r.tags.join(", "), openIssues: String(r.openIssues) }
}

/** "pci, API ,, pci" → ["pci", "api"] */
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))]
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i

export function validateResourceForm(
  v: ResourceFormValues,
  isNameTaken: (name: string) => boolean,
): ResourceFormErrors {
  const errors: ResourceFormErrors = {}
  const name = v.name.trim()

  if (!name) errors.name = "Enter a name."
  else if (!NAME_PATTERN.test(name))
    errors.name = "Use letters, numbers, dots, dashes or underscores, without spaces."
  else if (isNameTaken(name)) errors.name = "A resource with this name already exists."

  if (!v.type.trim()) errors.type = "Enter a type, e.g. S3 Bucket."
  if (!v.region.trim()) errors.region = "Enter a region, e.g. us-east-1."
  if (!v.owner.trim()) errors.owner = "Enter the owning team."

  const issues = v.openIssues.trim()
  if (!/^\d+$/.test(issues) || Number(issues) > 9999)
    errors.openIssues = "Enter a whole number from 0 to 9999."

  return errors
}

/** Only call once validateResourceForm returned no errors. */
export function toResourceInput(v: ResourceFormValues): Omit<Resource, "id"> {
  return {
    name: v.name.trim(),
    type: v.type.trim().replace(/\s+/g, " "),
    provider: v.provider,
    region: v.region.trim(),
    environment: v.environment,
    criticality: v.criticality,
    owner: v.owner.trim(),
    tags: parseTags(v.tags),
    openIssues: Number(v.openIssues.trim()),
  }
}
