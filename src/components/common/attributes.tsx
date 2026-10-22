import { cn } from "@/lib/utils"
import { CRITICALITY_LABEL, ENVIRONMENT_LABEL } from "@/lib/labels"
import { CRITICALITIES, type Criticality, type Environment, type Provider } from "@/types"

const CRIT_TEXT: Record<Criticality, string> = {
  critical: "text-crit-critical",
  high: "text-crit-high",
  medium: "text-crit-medium",
  low: "text-crit-low",
}

/**
 * A four-step bar meter: severity is readable from the number of filled bars,
 * not only from colour.
 */
export function CriticalityMeter({ level, className }: { level: Criticality; className?: string }) {
  const filled = CRITICALITIES.length - CRITICALITIES.indexOf(level)
  return (
    <svg
      viewBox="0 0 15 12"
      aria-hidden
      className={cn("h-3 w-[15px] shrink-0", CRIT_TEXT[level], className)}
    >
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 4}
          y={9 - i * 3}
          width={3}
          height={3 + i * 3}
          rx={0.75}
          fill="currentColor"
          opacity={i < filled ? 1 : 0.18}
        />
      ))}
    </svg>
  )
}

export function CriticalityLabel({ level, className }: { level: Criticality; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <CriticalityMeter level={level} />
      <span className={cn("font-medium", CRIT_TEXT[level])}>{CRITICALITY_LABEL[level]}</span>
    </span>
  )
}

const PROVIDER_COLOR: Record<Provider, string> = {
  AWS: "var(--provider-aws)",
  GCP: "var(--provider-gcp)",
  Azure: "var(--provider-azure)",
}

export function ProviderLabel({ provider, className }: { provider: Provider; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span
        aria-hidden
        className="size-2 rounded-[2px]"
        style={{ backgroundColor: PROVIDER_COLOR[provider] }}
      />
      {provider}
    </span>
  )
}

/** Production is the one that matters in a security tool, so it's the only one with weight. */
export function EnvironmentLabel({ environment }: { environment: Environment }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs",
        environment === "production"
          ? "bg-primary/[0.07] text-foreground font-medium shadow-[inset_0_0_0_1px_rgba(27,37,64,0.18)]"
          : environment === "staging"
            ? "bg-secondary text-muted-foreground"
            : "text-muted-foreground border border-dashed border-input",
      )}
    >
      {ENVIRONMENT_LABEL[environment]}
    </span>
  )
}

export function IssueCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-muted-foreground text-sm">None</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span aria-hidden className="bg-crit-critical size-1.5 rounded-full" />
      {count}
      <span className="sr-only"> open issues</span>
    </span>
  )
}
