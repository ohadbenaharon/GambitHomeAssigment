import { Search, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { CriticalityLabel, ProviderLabel } from "@/components/common/attributes"
import { FilterMenu } from "@/components/resources/FilterMenu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EMPTY_FILTERS,
  filterResources,
  hasActiveFilters,
  type FacetKey,
  type ResourceFilters,
} from "@/lib/resources"
import { ENVIRONMENT_LABEL } from "@/lib/labels"
import { useStore } from "@/state/storeContext"
import { CRITICALITIES, ENVIRONMENTS, PROVIDERS } from "@/types"

interface ResourceToolbarProps {
  filters: ResourceFilters
  onChange: (next: ResourceFilters) => void
}

export function ResourceToolbar({ filters, onChange }: ResourceToolbarProps) {
  const { resources } = useStore()
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses search, as in most dev tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== "/" || target.closest("input, textarea, [contenteditable], [role=dialog]")) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Faceted counts: what this option would yield if it were the only value picked in its facet.
  const countFor =
    <K extends FacetKey>(key: K) =>
    (value: ResourceFilters[K][number]) =>
      filterResources(resources, { ...filters, [key]: [value] }).length

  const set = <K extends keyof ResourceFilters>(key: K, value: ResourceFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          ref={searchRef}
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") set("query", "")
          }}
          placeholder="Search by name"
          maxLength={100}
          aria-label="Search resources by name"
          className="bg-card h-9 pr-9 pl-9"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => {
              set("query", "")
              searchRef.current?.focus()
            }}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded outline-none focus-visible:ring-2"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="text-muted-foreground border-border pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 text-[11px] leading-[18px] sm:block">
            /
          </kbd>
        )}
      </div>

      <FilterMenu
        label="Provider"
        options={PROVIDERS}
        selected={filters.provider}
        onChange={(v) => set("provider", v)}
        countFor={countFor("provider")}
        renderOption={(p) => <ProviderLabel provider={p} />}
      />
      <FilterMenu
        label="Environment"
        options={ENVIRONMENTS}
        selected={filters.environment}
        onChange={(v) => set("environment", v)}
        countFor={countFor("environment")}
        renderOption={(e) => ENVIRONMENT_LABEL[e]}
      />
      <FilterMenu
        label="Criticality"
        options={CRITICALITIES}
        selected={filters.criticality}
        onChange={(v) => set("criticality", v)}
        countFor={countFor("criticality")}
        renderOption={(c) => <CriticalityLabel level={c} />}
      />

      {hasActiveFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-9"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Reset
        </Button>
      )}
    </div>
  )
}
