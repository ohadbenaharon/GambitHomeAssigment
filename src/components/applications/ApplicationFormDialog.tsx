import { useId, useState, type FormEvent } from "react"
import { CriticalityMeter } from "@/components/common/attributes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sortResources } from "@/lib/resources"
import { useStore } from "@/state/storeContext"
import type { Application, Resource } from "@/types"

const NAME_MAX = 60

/** One dialog, two modes: create from a selection, or rename an existing application. */
type Mode =
  | { kind: "create"; resources: Resource[]; onCreated: (app: Application) => void }
  | { kind: "edit"; application: Application; onSaved?: () => void }

interface ApplicationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: Mode
}

export function ApplicationFormDialog({ open, onOpenChange, mode }: ApplicationFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted only while open, so the form starts fresh every time without reset effects. */}
        {open && <ApplicationForm mode={mode} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ApplicationForm({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const { createApplication, updateApplication, isApplicationNameTaken } = useStore()
  const editing = mode.kind === "edit" ? mode.application : undefined

  const [name, setName] = useState(editing?.name ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [touched, setTouched] = useState(false)
  const nameId = useId()
  const errorId = useId()

  const trimmed = name.trim()
  const error =
    trimmed === ""
      ? "Give the application a name."
      : isApplicationNameTaken(trimmed, editing?.id)
        ? "An application with this name already exists."
        : null
  const showError = touched && error !== null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (error) return
    if (mode.kind === "create") {
      if (mode.resources.length === 0) return
      mode.onCreated(
        createApplication({ name: trimmed, description, resourceIds: mode.resources.map((r) => r.id) }),
      )
    } else {
      updateApplication(mode.application.id, { name: trimmed, description })
      onClose()
      mode.onSaved?.()
    }
  }

  const count = mode.kind === "create" ? mode.resources.length : 0

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{mode.kind === "create" ? "Create application" : "Edit application"}</DialogTitle>
        <DialogDescription>
          {mode.kind === "create"
            ? `Group ${count === 1 ? "this resource" : `these ${count} resources`} under one name so you can track them together.`
            : "Rename the application or change its description. Manage resources from the application page."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={name}
          maxLength={NAME_MAX}
          autoFocus
          autoComplete="off"
          placeholder="e.g. Payments API"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => trimmed !== "" && setTouched(true)}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
        />
        {showError && (
          <p id={errorId} className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${nameId}-desc`}>
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={`${nameId}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={240}
          placeholder="What does this application do?"
          className="resize-none"
        />
      </div>

      {mode.kind === "create" && (
        <div className="grid gap-2">
          <span className="text-sm font-medium">Resources</span>
          <ul className="bg-muted/50 max-h-44 divide-y overflow-y-auto rounded-md border">
            {sortResources(mode.resources, { key: "criticality", dir: "desc" }).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <CriticalityMeter level={r.criticality} />
                <span className="truncate font-medium">{r.name}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">{r.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={touched && error !== null}>
          {mode.kind === "create" ? "Create application" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}
