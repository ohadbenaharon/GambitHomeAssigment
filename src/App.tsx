import { useCallback, useEffect, useRef } from "react"
import { ApplicationNotFound } from "@/components/applications/ApplicationNotFound"
import { ApplicationView } from "@/components/applications/ApplicationView"
import { MobileNav } from "@/components/layout/MobileNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { ResourcesView, type InventoryState } from "@/components/resources/ResourcesView"
import { Toaster } from "@/components/ui/sonner"
import { notify } from "@/lib/notify"
import { useSessionSelection } from "@/state/useSessionSelection"
import { useStore } from "@/state/storeContext"
import { useUrlState } from "@/state/useUrlState"

export default function App() {
  const { getApplication, deleteApplication, resourcesById } = useStore()
  const url = useUrlState()
  const { view, setView } = url
  const mainRef = useRef<HTMLElement>(null)

  const exists = useCallback((id: string) => resourcesById.has(id), [resourcesById])
  const [selected, setSelected] = useSessionSelection(exists)

  const inventory: InventoryState = {
    filters: url.filters,
    setFilters: url.setFilters,
    sort: url.sort,
    setSort: url.setSort,
    page: url.page,
    setPage: url.setPage,
    pageSize: url.pageSize,
    setPageSize: url.setPageSize,
    selected,
    setSelected,
  }

  const activeApp = view.kind === "application" ? getApplication(view.id) : undefined

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [view])

  // A readable tab title also makes Back/Forward history entries recognisable.
  useEffect(() => {
    const page =
      view.kind === "resources" ? "Resources" : (activeApp?.name ?? "Application not found")
    document.title = `${page} – Cloud Inventory`
  }, [view, activeApp?.name])

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <Sidebar view={view} onNavigate={setView} />
      </aside>

      <main ref={mainRef} className="bg-card/40 min-w-0 flex-1 overflow-y-auto md:bg-transparent">
        {/* Below md the sidebar collapses into a simple top bar. */}
        <MobileNav view={view} onNavigate={setView} />

        {view.kind === "application" && !activeApp ? (
          // A stale link, or the application was deleted in another tab.
          <ApplicationNotFound onBrowseResources={() => setView({ kind: "resources" })} />
        ) : view.kind === "resources" || !activeApp ? (
          <ResourcesView
            state={inventory}
            onApplicationCreated={(app) => {
              setView({ kind: "application", id: app.id })
              notify.success(`Created ${app.name}`, {
                description: `${app.resourceIds.length} resources grouped.`,
              })
            }}
          />
        ) : (
          <ApplicationView
            key={activeApp.id}
            application={activeApp}
            onBrowseResources={() => setView({ kind: "resources" })}
            onDelete={() => {
              deleteApplication(activeApp.id)
              setView({ kind: "resources" })
              notify.removed(`Deleted ${activeApp.name}`, { description: "Its resources are still in the inventory." })
            }}
          />
        )}
      </main>

      {/* Top-right keeps toasts clear of the selection bar at the bottom. */}
      <Toaster position="top-right" />
    </div>
  )
}
