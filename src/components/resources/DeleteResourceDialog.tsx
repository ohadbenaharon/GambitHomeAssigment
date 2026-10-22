import { useId, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { useStore } from "@/state/storeContext"
import type { Resource } from "@/types"

interface DeleteResourceDialogProps {
  resource: Resource | null
  onOpenChange: (open: boolean) => void
  onConfirm: (resource: Resource) => void
}

/**
 * Deleting cascades into applications, so the dialog names every application
 * that will lose the resource, and every delete asks for the resource's name to
 * be typed: unlike a fixed phrase, that can't become muscle memory and makes
 * you read what you're deleting.
 */
export function DeleteResourceDialog({ resource, onOpenChange, onConfirm }: DeleteResourceDialogProps) {
  return (
    <Dialog open={resource !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted per open, so the typed confirmation starts empty every time. */}
        {resource && <DeleteResourceForm resource={resource} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}

function DeleteResourceForm({ resource, onConfirm }: { resource: Resource; onConfirm: (r: Resource) => void }) {
  const { applicationsFor } = useStore()
  const usedBy = applicationsFor(resource.id)
  const [typed, setTyped] = useState("")
  const inputId = useId()
  const confirmed = typed.trim() === resource.name

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (confirmed) onConfirm(resource)
      }}
    >
      <DialogHeader>
        <DialogTitle>Delete {resource.name}?</DialogTitle>
        <DialogDescription>
          {usedBy.length === 0
            ? "It isn't part of any application. It will be removed from the inventory."
            : `It will be removed from the inventory and from ${usedBy.length === 1 ? "this application" : `these ${usedBy.length} applications`}:`}
        </DialogDescription>
      </DialogHeader>

      {usedBy.length > 0 && (
        <ul className="border-destructive/25 bg-destructive/[0.04] divide-destructive/15 divide-y rounded-md border text-sm">
          {usedBy.map((app) => (
            <li key={app.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate font-medium">{app.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {app.resourceIds.length - 1 === 0
                  ? "will be left empty"
                  : `${app.resourceIds.length - 1} ${app.resourceIds.length - 1 === 1 ? "resource" : "resources"} left`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2">
        <label htmlFor={inputId} className="text-sm">
          To confirm, type <span className="bg-muted rounded px-1 py-0.5 font-medium select-all">{resource.name}</span>
        </label>
        <Input
          id={inputId}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={!confirmed}>
          {usedBy.length > 0 ? "Delete everywhere" : "Delete resource"}
        </Button>
      </DialogFooter>
    </form>
  )
}
