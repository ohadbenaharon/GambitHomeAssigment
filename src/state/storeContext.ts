import { createContext, useContext } from "react"
import type { Layouts } from "@/state/store"
import type { Application, Point, Resource } from "@/types"

export type ResourceInput = Omit<Resource, "id">
export type ApplicationInput = { name: string; description?: string }

export interface StoreContextValue {
  resources: Resource[]
  resourcesById: ReadonlyMap<string, Resource>
  applications: Application[]
  layouts: Layouts

  getApplication: (id: string) => Application | undefined
  /** Membership is many-to-many, so a resource can be in several applications. */
  applicationsFor: (resourceId: string) => Application[]
  isApplicationNameTaken: (name: string, exceptId?: string) => boolean
  isResourceNameTaken: (name: string, exceptId?: string) => boolean

  addResource: (input: ResourceInput) => Resource
  updateResource: (resource: Resource) => void
  /** Also removes it from every application. Returns an undo function. */
  deleteResource: (id: string) => () => void

  createApplication: (input: ApplicationInput & { resourceIds: string[] }) => Application
  updateApplication: (id: string, input: ApplicationInput) => void
  /** Ids already in the application are ignored. */
  addToApplication: (id: string, resourceIds: string[]) => void
  removeFromApplication: (id: string, resourceId: string) => void
  deleteApplication: (id: string) => void

  saveLayout: (appId: string, positions: Record<string, Point>) => void
  resetLayout: (appId: string) => void
}

export const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}
