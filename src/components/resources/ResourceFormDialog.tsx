import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { CriticalityLabel, ProviderLabel } from "@/components/common/attributes"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ENVIRONMENT_LABEL } from "@/lib/labels"
import {
  EMPTY_RESOURCE_FORM,
  toFormValues,
  toResourceInput,
  validateResourceForm,
  type ResourceFormValues,
} from "@/lib/resourceForm"
import { useStore } from "@/state/storeContext"
import { CRITICALITIES, ENVIRONMENTS, PROVIDERS, type Resource } from "@/types"

interface ResourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present = edit mode. */
  resource?: Resource
  onSaved?: (resource: Resource) => void
}

export function ResourceFormDialog({ open, onOpenChange, resource, onSaved }: ResourceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        {open && (
          <ResourceForm
            resource={resource}
            onCancel={() => onOpenChange(false)}
            onSaved={(r) => {
              onOpenChange(false)
              onSaved?.(r)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResourceForm({
  resource,
  onCancel,
  onSaved,
}: {
  resource?: Resource
  onCancel: () => void
  onSaved: (r: Resource) => void
}) {
  const { resources, isResourceNameTaken, addResource, updateResource } = useStore()
  const [values, setValues] = useState<ResourceFormValues>(() =>
    resource ? toFormValues(resource) : EMPTY_RESOURCE_FORM,
  )
  const [submitted, setSubmitted] = useState(false)
  const id = useId()

  const errors = validateResourceForm(values, (name) => isResourceNameTaken(name, resource?.id))
  const hasErrors = Object.keys(errors).length > 0
  const knownTypes = useMemo(() => [...new Set(resources.map((r) => r.type))].sort(), [resources])

  const set = <K extends keyof ResourceFormValues>(key: K, value: ResourceFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  // Errors appear after the first submit attempt, then update live as fields are fixed.
  const errorFor = (key: keyof ResourceFormValues) => (submitted ? errors[key] : undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors) return
    const input = toResourceInput(values)
    if (resource) {
      const updated = { ...input, id: resource.id }
      updateResource(updated)
      onSaved(updated)
    } else {
      onSaved(addResource(input))
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{resource ? `Edit ${resource.name}` : "Add resource"}</DialogTitle>
        <DialogDescription>
          {resource
            ? "Changes apply everywhere this resource appears, including its applications."
            : "Add a resource to the inventory by hand. In production these would come from a cloud scan."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Name" error={errorFor("name")} className="sm:col-span-2">
          <Input
            id={`${id}-name`}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. orders-queue-prod"
            autoFocus
            autoComplete="off"
            maxLength={80}
            aria-invalid={!!errorFor("name")}
          />
        </Field>

        <Field id={`${id}-type`} label="Type" error={errorFor("type")}>
          <Input
            id={`${id}-type`}
            value={values.type}
            onChange={(e) => set("type", e.target.value)}
            list={`${id}-types`}
            placeholder="e.g. S3 Bucket"
            autoComplete="off"
            maxLength={60}
            aria-invalid={!!errorFor("type")}
          />
          <datalist id={`${id}-types`}>
            {knownTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <Field id={`${id}-provider`} label="Provider">
          <Select value={values.provider} onValueChange={(v) => set("provider", v as Resource["provider"])}>
            <SelectTrigger id={`${id}-provider`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  <ProviderLabel provider={p} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id={`${id}-region`} label="Region" error={errorFor("region")}>
          <Input
            id={`${id}-region`}
            value={values.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="e.g. us-east-1"
            autoComplete="off"
            maxLength={40}
            aria-invalid={!!errorFor("region")}
          />
        </Field>

        <Field id={`${id}-env`} label="Environment">
          <Select
            value={values.environment}
            onValueChange={(v) => set("environment", v as Resource["environment"])}
          >
            <SelectTrigger id={`${id}-env`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ENVIRONMENT_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id={`${id}-crit`} label="Criticality">
          <Select
            value={values.criticality}
            onValueChange={(v) => set("criticality", v as Resource["criticality"])}
          >
            <SelectTrigger id={`${id}-crit`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRITICALITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <CriticalityLabel level={c} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id={`${id}-owner`} label="Owner" error={errorFor("owner")}>
          <Input
            id={`${id}-owner`}
            value={values.owner}
            onChange={(e) => set("owner", e.target.value)}
            placeholder="Team, e.g. payments"
            autoComplete="off"
            maxLength={40}
            aria-invalid={!!errorFor("owner")}
          />
        </Field>

        <Field id={`${id}-tags`} label="Tags" hint="Comma-separated">
          <Input
            id={`${id}-tags`}
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="e.g. pci, api"
            autoComplete="off"
          />
        </Field>

        <Field id={`${id}-issues`} label="Open issues" error={errorFor("openIssues")}>
          <Input
            id={`${id}-issues`}
            value={values.openIssues}
            onChange={(e) => set("openIssues", e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!errorFor("openIssues")}
          />
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitted && hasErrors}>
          {resource ? "Save changes" : "Add resource"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`grid content-start gap-2 ${className ?? ""}`}>
      <Label htmlFor={id}>
        {label}
        {hint && <span className="text-muted-foreground font-normal">{hint}</span>}
      </Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
