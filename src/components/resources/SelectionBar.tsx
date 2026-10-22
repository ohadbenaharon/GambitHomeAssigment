import { ChevronDown, Layers, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Application } from "@/types"

interface SelectionBarProps {
  count: number
  /** Selected rows not on screen (other pages or filtered out); surfaced so nothing is grouped by surprise. */
  hiddenCount: number
  applications: Application[]
  onClear: () => void
  onCreate: () => void
  onAddTo: (app: Application) => void
}

export function SelectionBar({ count, hiddenCount, applications, onClear, onCreate, onAddTo }: SelectionBarProps) {
  return (
    <div
      role="region"
      aria-label="Selection"
      className="bg-primary text-primary-foreground animate-in fade-in slide-in-from-bottom-2 flex flex-wrap items-center gap-2 rounded-xl py-2 pr-2 pl-4 shadow-[0_12px_32px_-12px_rgba(27,37,64,0.55)]"
    >
      <span className="text-sm" aria-live="polite">
        <span className="font-medium">{count} selected</span>
        {hiddenCount > 0 && <span className="text-primary-foreground/60">, {hiddenCount} not shown</span>}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-primary-foreground/80 hover:text-primary-foreground ml-1 hover:bg-white/10"
      >
        <X />
        Clear
      </Button>
      {applications.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground bg-white/10 hover:bg-white/15 hover:text-primary-foreground"
            >
              <Plus />
              Add to
              <ChevronDown className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="max-h-72 min-w-52 overflow-y-auto">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              Add to application
            </DropdownMenuLabel>
            {applications.map((app) => (
              <DropdownMenuItem key={app.id} onSelect={() => onAddTo(app)}>
                <span className="truncate">{app.name}</span>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">{app.resourceIds.length}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button size="sm" onClick={onCreate} className="bg-card text-foreground hover:bg-card/90">
        <Layers />
        Create application
      </Button>
    </div>
  )
}
