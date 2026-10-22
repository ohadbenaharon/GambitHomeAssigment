import { Pencil, Plus, SearchX, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ApplicationFormDialog } from "@/components/applications/ApplicationFormDialog"
import { Pagination } from "@/components/common/Pagination"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { DeleteResourceDialog } from "@/components/resources/DeleteResourceDialog"
import { ResourceFormDialog } from "@/components/resources/ResourceFormDialog"
import { ResourceTable } from "@/components/resources/ResourceTable"
import { ResourceToolbar } from "@/components/resources/ResourceToolbar"
import { SelectionBar } from "@/components/resources/SelectionBar"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { paginate, type PageSize } from "@/lib/pagination"
import {
  EMPTY_FILTERS,
  filterResources,
  sortResources,
  type ResourceFilters,
  type SortState,
} from "@/lib/resources"
import { useStore } from "@/state/storeContext"
import type { Application, Resource } from "@/types"

/**
 * Lives in <App> so filters, sort, paging and selection survive a trip to an
 * application and back.
 */
export interface InventoryState {
  filters: ResourceFilters
  setFilters: (f: ResourceFilters) => void
  sort: SortState
  setSort: (s: SortState) => void
  page: number
  setPage: (p: number) => void
  pageSize: PageSize
  setPageSize: (s: PageSize) => void
  selected: ReadonlySet<string>
  setSelected: (s: ReadonlySet<string>) => void
}

interface ResourcesViewProps {
  state: InventoryState
  onApplicationCreated: (app: Application) => void
}

export function ResourcesView({ state, onApplicationCreated }: ResourcesViewProps) {
  const { filters, setFilters, sort, setSort, page, setPage, pageSize, setPageSize, selected, setSelected } = state
  const { resources, resourcesById, applications, addToApplication, applicationsFor, deleteResource } = useStore()
  const [createOpen, setCreateOpen] = useState(false)
  // undefined: closed. null: adding. A resource: editing it.
  const [editing, setEditing] = useState<Resource | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Resource | null>(null)

  const confirmDelete = (r: Resource) => {
    const appCount = applicationsFor(r.id).length
    const undo = deleteResource(r.id)
    setDeleting(null)
    if (selected.has(r.id)) {
      const next = new Set(selected)
      next.delete(r.id)
      setSelected(next)
    }
    notify.removed(`Deleted ${r.name}`, {
      description:
        appCount > 0 ? `Also removed from ${appCount} ${appCount === 1 ? "application" : "applications"}.` : undefined,
      action: { label: "Undo", onClick: undo },
    })
  }

  const sorted = useMemo(
    () => sortResources(filterResources(resources, filters), sort),
    [resources, filters, sort],
  )
  const current = paginate(sorted, page, pageSize)

  // paginate() clamps an out-of-range page (?page=9 in a link, or deleting the
  // last row of the last page); write the clamped value back so the URL agrees.
  useEffect(() => {
    if (current.page !== page) setPage(current.page)
  }, [current.page, page, setPage])

  const hiddenSelected = useMemo(() => {
    const visible = new Set(current.items.map((r) => r.id))
    return [...selected].filter((id) => !visible.has(id)).length
  }, [current.items, selected])

  const selectedResources = useMemo(
    () => [...selected].flatMap((id) => resourcesById.get(id) ?? []),
    [selected, resourcesById],
  )

  // Changing what's listed sends you back to the first page.
  const changeFilters = (f: ResourceFilters) => {
    setFilters(f)
    setPage(0)
  }
  const changeSort = (s: SortState) => {
    setSort(s)
    setPage(0)
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleMany = (ids: string[], checked: boolean) => {
    const next = new Set(selected)
    for (const id of ids) {
      if (checked) next.add(id)
      else next.delete(id)
    }
    setSelected(next)
  }

  const addSelectionTo = (app: Application) => {
    const added = [...selected].filter((id) => !app.resourceIds.includes(id)).length
    if (added === 0) {
      notify.info(`Already in ${app.name}`, { description: "Every selected resource is already a member." })
      return
    }
    addToApplication(app.id, [...selected])
    setSelected(new Set())
    notify.success(`Added ${added} ${added === 1 ? "resource" : "resources"} to ${app.name}`)
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-start gap-4 px-6 pt-7 pb-5 lg:px-10">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every monitored cloud resource. Select some to group them into an application.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing(null)}>
          <Plus />
          Add resource
        </Button>
      </header>

      <div className="px-6 pb-3 lg:px-10">
        <ResourceToolbar filters={filters} onChange={changeFilters} />
      </div>

      <div className="flex-1 px-6 pb-28 lg:px-10">
        <div className="bg-card overflow-hidden rounded-lg border">
          <ResourceTable
            rows={current.items}
            sort={sort}
            onSortChange={changeSort}
            selection={{ selected, onToggle: toggle, onToggleMany: toggleMany }}
            rowActions={(r) => (
              <RowActionsMenu
                label={`Actions for ${r.name}`}
                actions={[
                  { label: "Edit resource", icon: Pencil, onSelect: () => setEditing(r) },
                  { label: "Delete resource", icon: Trash2, onSelect: () => setDeleting(r), destructive: true },
                ]}
              />
            )}
            empty={
              resources.length === 0 ? (
                <EmptyMessage
                  title="No resources yet"
                  body="Add the first one to start building applications."
                  action={<Button size="sm" onClick={() => setEditing(null)}>Add resource</Button>}
                />
              ) : (
                <EmptyMessage
                  title="No resources match these filters"
                  body="Try a shorter name or remove a filter."
                  action={
                    <Button variant="outline" size="sm" onClick={() => changeFilters(EMPTY_FILTERS)}>
                      Reset filters
                    </Button>
                  }
                />
              )
            }
          />
        </div>
        <div className="mt-3">
          <Pagination
            page={current}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(0)
            }}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="pointer-events-none sticky bottom-6 z-10 flex justify-center px-6">
          <div className="pointer-events-auto">
            <SelectionBar
              count={selected.size}
              hiddenCount={hiddenSelected}
              applications={applications}
              onClear={() => setSelected(new Set())}
              onCreate={() => setCreateOpen(true)}
              onAddTo={addSelectionTo}
            />
          </div>
        </div>
      )}

      <ApplicationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode={{
          kind: "create",
          resources: selectedResources,
          onCreated: (app) => {
            setCreateOpen(false)
            setSelected(new Set())
            onApplicationCreated(app)
          },
        }}
      />

      <DeleteResourceDialog
        resource={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <ResourceFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        resource={editing ?? undefined}
        onSaved={(r) => notify.success(editing ? `Saved ${r.name}` : `Added ${r.name}`)}
      />
    </div>
  )
}

function EmptyMessage({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <SearchX className="text-muted-foreground size-6" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
      {action}
    </div>
  )
}
