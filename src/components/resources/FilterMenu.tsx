import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface FilterMenuProps<T extends string> {
  label: string
  options: readonly T[]
  selected: readonly T[]
  onChange: (next: T[]) => void
  /** How many rows each option would produce given the other active filters. */
  countFor: (option: T) => number
  renderOption?: (option: T) => ReactNode
}

export function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onChange,
  countFor,
  renderOption = (o) => o,
}: FilterMenuProps<T>) {
  const active = selected.length > 0

  const toggle = (option: T, checked: boolean) =>
    onChange(
      checked
        ? // Keep the canonical option order regardless of click order.
          options.filter((o) => o === option || selected.includes(o))
        : selected.filter((o) => o !== option),
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 font-normal",
            active && "border-selection/40 bg-selection-tint text-foreground hover:bg-selection-tint",
          )}
        >
          {label}
          {active && (
            <span className="bg-selection text-primary-foreground rounded px-1.5 text-[11px] leading-[18px] font-medium">
              {selected.length}
            </span>
          )}
          <ChevronDown className="text-muted-foreground size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        {options.map((option) => {
          const count = countFor(option)
          return (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selected.includes(option)}
              onCheckedChange={(checked) => toggle(option, checked)}
              // Keep the menu open for multi-select.
              onSelect={(e) => e.preventDefault()}
              className="justify-between gap-6"
            >
              {renderOption(option)}
              <span className={cn("text-xs tabular-nums", count === 0 ? "text-muted-foreground/50" : "text-muted-foreground")}>
                {count}
              </span>
            </DropdownMenuCheckboxItem>
          )
        })}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])} className="text-muted-foreground">
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
