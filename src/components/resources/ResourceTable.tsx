import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import {
  CriticalityLabel,
  EnvironmentLabel,
  IssueCount,
  ProviderLabel,
} from "@/components/common/attributes"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SortKey, SortState } from "@/lib/resources"
import { cn } from "@/lib/utils"
import type { Resource } from "@/types"

export interface TableSelection {
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  /** Applies to the rows currently shown, not the whole dataset. */
  onToggleMany: (ids: string[], checked: boolean) => void
}

interface ResourceTableProps {
  rows: Resource[]
  sort: SortState
  onSortChange: (next: SortState) => void
  /** Omit for a read-only table (e.g. an application's members). */
  selection?: TableSelection
  highlightedId?: string | null
  /** Rendered in place of the body when there are no rows. */
  empty?: ReactNode
  /** Per-row menu (edit, remove...). Adds a trailing column. */
  rowActions?: (resource: Resource) => ReactNode
}

export function ResourceTable({
  rows,
  sort,
  onSortChange,
  selection,
  highlightedId,
  empty,
  rowActions,
}: ResourceTableProps) {
  const visibleIds = rows.map((r) => r.id)
  const selectedVisible = selection ? visibleIds.filter((id) => selection.selected.has(id)).length : 0
  const headerState: boolean | "indeterminate" =
    selectedVisible === 0 ? false : selectedVisible === rows.length ? true : "indeterminate"

  const columnCount = 6 + (selection ? 1 : 0) + (rowActions ? 1 : 0)

  return (
    <Table className="min-w-[880px] table-fixed">
      <colgroup>
        {selection && <col className="w-12" />}
        <col className="w-[28%]" />
        <col className="w-[18%]" />
        <col />
        <col />
        <col />
        <col className="w-28" />
        {rowActions && <col className="w-14" />}
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {selection && (
            <TableHead className="pl-4">
              <Checkbox
                checked={headerState}
                disabled={rows.length === 0}
                onCheckedChange={() => selection.onToggleMany(visibleIds, headerState !== true)}
                aria-label={headerState === true ? "Deselect all shown resources" : "Select all shown resources"}
              />
            </TableHead>
          )}
          <SortableHead column="name" sort={sort} onSortChange={onSortChange} className={!selection ? "pl-4" : undefined}>
            Name
          </SortableHead>
          <TableHead>Type</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Environment</TableHead>
          <SortableHead column="criticality" sort={sort} onSortChange={onSortChange}>
            Criticality
          </SortableHead>
          <SortableHead column="openIssues" sort={sort} onSortChange={onSortChange} className={rowActions ? undefined : "pr-4"}>
            Open issues
          </SortableHead>
          {rowActions && (
            <TableHead className="pr-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="p-0">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
            <ResourceRow
              key={r.id}
              resource={r}
              selection={selection}
              highlighted={highlightedId === r.id}
              actions={rowActions?.(r)}
            />
          ))
        )}
      </TableBody>
    </Table>
  )
}

function ResourceRow({
  resource: r,
  selection,
  highlighted,
  actions,
}: {
  resource: Resource
  selection?: TableSelection
  highlighted: boolean
  actions?: ReactNode
}) {
  const ref = useRef<HTMLTableRowElement>(null)
  const checked = selection?.selected.has(r.id) ?? false

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [highlighted])

  return (
    <TableRow
      ref={ref}
      data-state={checked ? "selected" : undefined}
      onClick={selection ? () => selection.onToggle(r.id) : undefined}
      className={cn(
        "h-14 data-[state=selected]:bg-selection-tint",
        selection && "cursor-pointer",
        highlighted && "bg-selection-tint shadow-[inset_3px_0_0_var(--selection)]",
      )}
    >
      {selection && (
        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={() => selection.onToggle(r.id)}
            aria-label={`Select ${r.name}`}
          />
        </TableCell>
      )}
      <TableCell className={cn("truncate", !selection && "pl-4")}>
        <div className="truncate font-medium" title={r.name}>
          {r.name}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {r.region} <span className="text-border">/</span> {r.owner}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground truncate">{r.type}</TableCell>
      <TableCell>
        <ProviderLabel provider={r.provider} />
      </TableCell>
      <TableCell>
        <EnvironmentLabel environment={r.environment} />
      </TableCell>
      <TableCell>
        <CriticalityLabel level={r.criticality} />
      </TableCell>
      <TableCell className={actions ? undefined : "pr-4"}>
        <IssueCount count={r.openIssues} />
      </TableCell>
      {actions && (
        <TableCell className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
          {actions}
        </TableCell>
      )}
    </TableRow>
  )
}

function SortableHead({
  column,
  sort,
  onSortChange,
  className,
  children,
}: {
  column: SortKey
  sort: SortState
  onSortChange: (next: SortState) => void
  className?: string
  children: ReactNode
}) {
  const active = sort.key === column
  // Name reads naturally A→Z first; severity and issue counts start with the worst.
  const firstDir = column === "name" ? "asc" : "desc"
  const Icon = !active ? ArrowUpDown : sort.dir === "desc" ? ArrowDown : ArrowUp

  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() =>
          onSortChange({
            key: column,
            dir: active ? (sort.dir === "asc" ? "desc" : "asc") : firstDir,
          })
        }
        className={cn(
          "hover:text-foreground focus-visible:ring-ring/50 -ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 outline-none focus-visible:ring-2",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  )
}
