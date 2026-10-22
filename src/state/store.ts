import { seedResources } from "@/data/resources"
import {
  CRITICALITIES,
  ENVIRONMENTS,
  PROVIDERS,
  type Application,
  type Point,
  type Resource,
} from "@/types"

/** Saved node positions (top-left corners), keyed by application id, then node id. */
export type Layouts = Record<string, Record<string, Point>>

export interface StoreState {
  resources: Resource[]
  applications: Application[]
  layouts: Layouts
}

export type Action =
  | { type: "resource/add"; resource: Resource }
  | { type: "resource/update"; resource: Resource }
  /** Cascades: the resource also leaves every application it belonged to. */
  | { type: "resource/delete"; id: string }
  /** Undo for resource/delete: puts the resource back into the given applications. */
  | { type: "resource/restore"; resource: Resource; applicationIds: string[] }
  | { type: "app/create"; app: Application }
  | { type: "app/update"; id: string; name: string; description?: string }
  | { type: "app/addResources"; id: string; resourceIds: string[] }
  | { type: "app/removeResource"; id: string; resourceId: string }
  | { type: "app/delete"; id: string }
  | { type: "layout/save"; appId: string; positions: Record<string, Point> }
  | { type: "layout/reset"; appId: string }
  /** Another tab wrote newer state to localStorage. */
  | { type: "store/replace"; state: StoreState }

export const initialState: StoreState = {
  resources: seedResources,
  applications: [],
  layouts: {},
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record
  const { [key]: _removed, ...rest } = record
  return rest
}

function updateApp(
  state: StoreState,
  id: string,
  fn: (app: Application) => Application,
): Application[] {
  return state.applications.map((a) => (a.id === id ? fn(a) : a))
}

/**
 * Pure, so it's unit-tested directly. Any change to an application's
 * membership drops its saved layout: a hand-arranged graph with a node
 * added or missing is worse than a clean default.
 */
export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "resource/add":
      return { ...state, resources: [...state.resources, action.resource] }

    case "resource/update":
      return {
        ...state,
        resources: state.resources.map((r) => (r.id === action.resource.id ? action.resource : r)),
      }

    case "resource/delete": {
      const affected = new Set(
        state.applications.filter((a) => a.resourceIds.includes(action.id)).map((a) => a.id),
      )
      return {
        resources: state.resources.filter((r) => r.id !== action.id),
        applications: state.applications.map((a) =>
          affected.has(a.id) ? { ...a, resourceIds: a.resourceIds.filter((rid) => rid !== action.id) } : a,
        ),
        layouts: Object.fromEntries(Object.entries(state.layouts).filter(([appId]) => !affected.has(appId))),
      }
    }

    case "resource/restore": {
      if (state.resources.some((r) => r.id === action.resource.id)) return state
      const targets = new Set(action.applicationIds)
      return {
        ...state,
        resources: [...state.resources, action.resource],
        applications: state.applications.map((a) =>
          targets.has(a.id) && !a.resourceIds.includes(action.resource.id)
            ? { ...a, resourceIds: [...a.resourceIds, action.resource.id] }
            : a,
        ),
      }
    }

    case "app/create": {
      const exists = new Set(state.resources.map((r) => r.id))
      const app = { ...action.app, resourceIds: action.app.resourceIds.filter((id) => exists.has(id)) }
      return { ...state, applications: [...state.applications, app] }
    }

    case "app/update":
      return {
        ...state,
        applications: updateApp(state, action.id, (a) => ({
          ...a,
          name: action.name,
          description: action.description,
        })),
      }

    case "app/addResources": {
      const app = state.applications.find((a) => a.id === action.id)
      if (!app) return state
      // Existing resources only: an Undo can arrive after the resource was deleted.
      const exists = new Set(state.resources.map((r) => r.id))
      const added = [...new Set(action.resourceIds)].filter(
        (rid) => exists.has(rid) && !app.resourceIds.includes(rid),
      )
      if (added.length === 0) return state
      return {
        ...state,
        applications: updateApp(state, action.id, (a) => ({
          ...a,
          resourceIds: [...a.resourceIds, ...added],
        })),
        layouts: withoutKey(state.layouts, action.id),
      }
    }

    case "app/removeResource":
      return {
        ...state,
        applications: updateApp(state, action.id, (a) => ({
          ...a,
          resourceIds: a.resourceIds.filter((rid) => rid !== action.resourceId),
        })),
        layouts: withoutKey(state.layouts, action.id),
      }

    case "app/delete":
      return {
        ...state,
        applications: state.applications.filter((a) => a.id !== action.id),
        layouts: withoutKey(state.layouts, action.id),
      }

    case "layout/save":
      return { ...state, layouts: { ...state.layouts, [action.appId]: action.positions } }

    case "layout/reset":
      return { ...state, layouts: withoutKey(state.layouts, action.appId) }

    case "store/replace":
      return action.state
  }
}

/* ---------- persistence ---------- */

export const STORAGE_KEY = "gambit.store.v2"

type Guard<T> = (v: unknown) => v is T

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === "string"
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const oneOf =
  <T extends string>(values: readonly T[]): Guard<T> =>
  (v): v is T =>
    values.includes(v as T)

const isResource: Guard<Resource> = (v): v is Resource =>
  isRecord(v) &&
  isString(v.id) &&
  isString(v.name) &&
  isString(v.type) &&
  oneOf(PROVIDERS)(v.provider) &&
  isString(v.region) &&
  oneOf(ENVIRONMENTS)(v.environment) &&
  oneOf(CRITICALITIES)(v.criticality) &&
  isString(v.owner) &&
  isStringArray(v.tags) &&
  Number.isInteger(v.openIssues) &&
  (v.openIssues as number) >= 0

const isApplication: Guard<Application> = (v): v is Application =>
  isRecord(v) &&
  isString(v.id) &&
  isString(v.name) &&
  isString(v.createdAt) &&
  (v.description === undefined || isString(v.description)) &&
  isStringArray(v.resourceIds)

const isPoint: Guard<Point> = (v): v is Point =>
  isRecord(v) && Number.isFinite(v.x) && Number.isFinite(v.y)

/**
 * localStorage is untrusted input (older versions, manual edits), so every
 * record is validated and dangling references are dropped rather than
 * left to break rendering later. Anything unreadable falls back to the seed.
 */
export function deserialize(raw: string | null): StoreState {
  if (raw === null) return initialState
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return initialState

    const resources = Array.isArray(parsed.resources)
      ? parsed.resources.filter(isResource)
      : initialState.resources
    const ids = new Set(resources.map((r) => r.id))

    const applications = (Array.isArray(parsed.applications) ? parsed.applications : [])
      .filter(isApplication)
      .map((a) => ({ ...a, resourceIds: a.resourceIds.filter((id) => ids.has(id)) }))
    const appIds = new Set(applications.map((a) => a.id))

    const layouts: Layouts = {}
    if (isRecord(parsed.layouts)) {
      for (const [appId, positions] of Object.entries(parsed.layouts)) {
        if (!appIds.has(appId) || !isRecord(positions)) continue
        const valid = Object.entries(positions).filter(([, p]) => isPoint(p))
        if (valid.length > 0) layouts[appId] = Object.fromEntries(valid) as Record<string, Point>
      }
    }

    return { resources, applications, layouts }
  } catch {
    return initialState
  }
}
