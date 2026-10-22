import type { Criticality, Environment } from "@/types"

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
}

export const CRIT_COLOR_VAR: Record<Criticality, string> = {
  critical: "var(--crit-critical)",
  high: "var(--crit-high)",
  medium: "var(--crit-medium)",
  low: "var(--crit-low)",
}
