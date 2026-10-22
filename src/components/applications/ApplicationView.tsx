import { Pencil, Trash2, Unlink } from "lucide-react"
import { lazy, Suspense, useMemo, useState, type ReactNode } from "react"
import { ApplicationFormDialog } from "@/components/applications/ApplicationFormDialog"
import { CriticalityLabel } from "@/components/common/attributes"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { ResourceFormDialog } from "@/components/resources/ResourceFormDialog"
import { ResourceTable } from "@/components/resources/ResourceTable"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { notify } from "@/lib/notify"
import { DEFAULT_SORT, highestCriticality, sortResources, type SortState } from "@/lib/resources"
import { useStore } from "@/state/storeContext"
import type { Application, Resource } from "@/types"

// React Flow is most of the bundle and only needed here, so it loads on first visit.
const ApplicationGraph = lazy(() =>
  import("@/components/applications/ApplicationGraph").then((m) => ({ default: m.ApplicationGraph })),
)

interface ApplicationViewProps {
  application: Application
  onDelete: () => void
  onBrowseResources: () => void
}

export function ApplicationView({ application, onDelete, onBrowseResources }: ApplicationViewProps) {
  const { resourcesById, layouts, removeFromApplication, addToApplication, resetLayout, applicationsFor } =
    useStore()
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<Resource | null>(null)
  // Bumped on "Reset layout" to remount the graph with default positions.
  const [layoutGeneration, setLayoutGeneration] = useState(0)

  const members = useMemo(
    () => application.resourceIds.flatMap((id) => resourcesById.get(id) ?? []),
    [application, resourcesById],
  )
  const rows = useMemo(() => sortResources(members, sort), [members, sort])

  const top = highestCriticality(members)
  const issues = members.reduce((n, r) => n + r.openIssues, 0)
  const providers = [...new Set(members.map((r) => r.provider))]
  const created = new Date(application.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const hasCustomLayout = application.id in layouts
  const otherApps = pendingRemoval
    ? applicationsFor(pendingRemoval.id).filter((a) => a.id !== application.id)
    : []

  const confirmRemoval = () => {
    if (!pendingRemoval) return
    const r = pendingRemoval
    removeFromApplication(application.id, r.id)
    setPendingRemoval(null)
    if (highlightedId === r.id) setHighlightedId(null)
    notify.removed(`Removed ${r.name} from ${application.name}`, {
      action: { label: "Undo", onClick: () => addToApplication(application.id, [r.id]) },
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-start gap-4 px-6 pt-7 pb-5 lg:px-10">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] leading-tight font-semibold tracking-tight">
            {application.name}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-[70ch] text-sm">
            {application.description ?? `Created ${created}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden border-y bg-[var(--border)] sm:grid-cols-4">
        <Fact label="Resources">{members.length}</Fact>
        <Fact label="Highest criticality">{top ? <CriticalityLabel level={top} /> : "None"}</Fact>
        <Fact label="Open issues">
          <span className={issues > 0 ? "text-crit-critical" : undefined}>{issues}</span>
        </Fact>
        <Fact label="Providers">{providers.join(", ") || "None"}</Fact>
      </dl>

      <section aria-label="Resource graph" className="relative h-[460px] shrink-0 border-b">
        <Suspense fallback={<div className="bg-graph-bg h-full" />}>
          <ApplicationGraph
            // Membership changes and resets start from the default layout.
            key={`${application.resourceIds.join(",")}|${layoutGeneration}`}
            application={application}
            highlightedId={highlightedId}
            onSelectResource={setHighlightedId}
            onResetLayout={() => {
              resetLayout(application.id)
              setLayoutGeneration((g) => g + 1)
            }}
          />
        </Suspense>
        {members.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
            <div className="bg-graph-node border-graph-node-border text-graph-text pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm">
              This application has no resources.
              <Button size="sm" variant="secondary" onClick={onBrowseResources}>
                Add from Resources
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="px-6 py-6 lg:px-10">
        <h2 className="mb-3 text-sm font-semibold">Member resources</h2>
        <div className="bg-card overflow-hidden rounded-lg border">
          <ResourceTable
            rows={rows}
            sort={sort}
            onSortChange={setSort}
            highlightedId={highlightedId}
            rowActions={(r) => (
              <RowActionsMenu
                label={`Actions for ${r.name}`}
                actions={[
                  { label: "Edit resource", icon: Pencil, onSelect: () => setEditingResource(r) },
                  {
                    label: "Remove from application",
                    icon: Unlink,
                    onSelect: () => setPendingRemoval(r),
                    destructive: true,
                  },
                ]}
              />
            )}
            empty={
              <p className="text-muted-foreground px-6 py-10 text-center text-sm">
                Select resources on the Resources page and choose Add to.
              </p>
            }
          />
        </div>
      </section>

      <ApplicationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode={{ kind: "edit", application, onSaved: () => notify.success("Application saved") }}
      />

      <ResourceFormDialog
        open={editingResource !== null}
        onOpenChange={(open) => !open && setEditingResource(null)}
        resource={editingResource ?? undefined}
        onSaved={(r) => notify.success(`Saved ${r.name}`)}
      />

      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {pendingRemoval?.name}?</DialogTitle>
            <DialogDescription>
              It will no longer be part of {application.name}. The resource stays in the inventory
              {otherApps.length > 0 &&
                ` and in ${otherApps.length === 1 ? otherApps[0]?.name : `${otherApps.length} other applications`}`}
              .{hasCustomLayout && " The graph will go back to its default layout."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmRemoval}>
              Remove from application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {application.name}?</DialogTitle>
            <DialogDescription>
              The application is removed. Its resources stay in the inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete}>
              Delete application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-card px-6 py-3.5 lg:px-10">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  )
}
