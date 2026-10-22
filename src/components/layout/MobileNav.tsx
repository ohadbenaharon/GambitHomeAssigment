import { Database } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CRIT_COLOR_VAR } from "@/lib/labels"
import { highestCriticality } from "@/lib/resources"
import type { View } from "@/lib/urlState"
import { useStore } from "@/state/storeContext"

const RESOURCES = "__resources__"

/**
 * Below md the sidebar collapses into this picker. It uses the app's own
 * Select rather than a native <select>: the native popup is drawn by the OS,
 * can't be styled, and renders unreadably small under some zoom/emulation setups.
 */
export function MobileNav({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { applications, resourcesById } = useStore()
  const known = view.kind === "resources" || applications.some((a) => a.id === view.id)
  const value = view.kind === "resources" ? RESOURCES : known ? view.id : undefined

  return (
    <div className="bg-background sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 md:hidden">
      <img src="/favicon.svg" alt="" className="size-7 shrink-0" />
      <Select
        value={value}
        onValueChange={(v) =>
          onNavigate(v === RESOURCES ? { kind: "resources" } : { kind: "application", id: v })
        }
      >
        <SelectTrigger aria-label="Go to" className="bg-card h-10 min-w-0 flex-1 text-sm">
          <SelectValue placeholder="Application not found" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[60dvh] w-[var(--radix-select-trigger-width)]">
          <SelectItem value={RESOURCES} className="py-2.5">
            <Database className="text-muted-foreground size-4" />
            Resources
          </SelectItem>
          {applications.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs">Applications</SelectLabel>
                {applications.map((app) => {
                  const top = highestCriticality(app.resourceIds.flatMap((id) => resourcesById.get(id) ?? []))
                  return (
                    <SelectItem key={app.id} value={app.id} className="py-2.5">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: top ? CRIT_COLOR_VAR[top] : "var(--border)" }}
                      />
                      <span className="truncate">{app.name}</span>
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
