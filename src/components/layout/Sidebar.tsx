import { Boxes, Database } from "lucide-react"
import type { ReactNode } from "react"
import { CRIT_COLOR_VAR } from "@/lib/labels"
import { highestCriticality } from "@/lib/resources"
import type { View } from "@/lib/urlState"
import { cn } from "@/lib/utils"
import { useStore } from "@/state/storeContext"


interface SidebarProps {
  view: View
  onNavigate: (view: View) => void
}

export function Sidebar({ view, onNavigate }: SidebarProps) {
  const { applications, resources, resourcesById } = useStore()

  return (
    <nav aria-label="Main" className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <img src="/favicon.svg" alt="" className="size-7" />
        <span className="font-semibold tracking-tight">Cloud Inventory</span>
      </div>

      <div className="px-3">
        <NavItem
          active={view.kind === "resources"}
          onClick={() => onNavigate({ kind: "resources" })}
          icon={<Database className="size-4" />}
          trailing={resources.length}
        >
          Resources
        </NavItem>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <h2 className="text-muted-foreground px-5 pb-1 text-xs font-medium">Applications</h2>
        {applications.length === 0 ? (
          <p className="text-muted-foreground mx-3 rounded-md border border-dashed px-3 py-3 text-xs leading-relaxed">
            None yet. Select resources in the table and choose Create application.
          </p>
        ) : (
          <ul
            // pt-1: the scroll container would otherwise clip the active item's 1px ring at the top.
            className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pt-1 pb-4"
          >
            {applications.map((app) => {
              const members = app.resourceIds.flatMap((id) => resourcesById.get(id) ?? [])
              const top = highestCriticality(members)
              return (
                <li key={app.id}>
                  <NavItem
                    active={view.kind === "application" && view.id === app.id}
                    onClick={() => onNavigate({ kind: "application", id: app.id })}
                    icon={
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ backgroundColor: top ? CRIT_COLOR_VAR[top] : "var(--border)" }}
                      />
                    }
                    trailing={members.length}
                  >
                    {app.name}
                  </NavItem>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="text-muted-foreground flex items-center gap-2 border-t px-5 py-3 text-xs">
        <Boxes className="size-3.5" />
        {applications.length} {applications.length === 1 ? "application" : "applications"}
      </div>
    </nav>
  )
}

function NavItem({
  active,
  onClick,
  icon,
  trailing,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-visible:ring-ring/50 flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm outline-none focus-visible:ring-2",
        active
          ? "bg-card text-foreground font-medium shadow-[0_0_0_1px_var(--border)]"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      )}
    >
      <span className="grid size-4 shrink-0 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing !== undefined && <span className="text-muted-foreground text-xs tabular-nums">{trailing}</span>}
    </button>
  )
}
