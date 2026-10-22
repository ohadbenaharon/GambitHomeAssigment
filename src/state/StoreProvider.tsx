import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react"
import { cleanName, normalizeName } from "@/lib/names"
import { STORAGE_KEY, deserialize, reducer } from "@/state/store"
import { StoreContext, type StoreContextValue } from "@/state/storeContext"
import type { Application, Resource } from "@/types"

function loadFromStorage() {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY))
  } catch {
    return deserialize(null)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage)
  // Last value written or received, so a change that came from another tab
  // isn't written straight back (which would bounce between tabs).
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
    const raw = JSON.stringify(state)
    if (raw === lastSynced.current) return
    lastSynced.current = raw
    try {
      localStorage.setItem(STORAGE_KEY, raw)
    } catch {
      // Storage full or blocked (private mode): the app still works for this session.
    }
  }, [state])

  // Two tabs open: a change in one shows up in the other instead of being
  // silently overwritten by whichever tab saves last.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const next = deserialize(e.newValue)
      lastSynced.current = JSON.stringify(next)
      dispatch({ type: "store/replace", state: next })
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const resourcesById = useMemo(
    () => new Map(state.resources.map((r) => [r.id, r])),
    [state.resources],
  )

  const isApplicationNameTaken = useCallback(
    (name: string, exceptId?: string) =>
      state.applications.some(
        (a) => a.id !== exceptId && normalizeName(a.name) === normalizeName(name),
      ),
    [state.applications],
  )

  const isResourceNameTaken = useCallback(
    (name: string, exceptId?: string) =>
      state.resources.some(
        (r) => r.id !== exceptId && normalizeName(r.name) === normalizeName(name),
      ),
    [state.resources],
  )

  // Dispatch is stable, so the action functions are created once.
  const actions = useMemo(
    () => ({
      addResource: (input: Omit<Resource, "id">) => {
        const resource: Resource = { ...input, id: `r-${crypto.randomUUID().slice(0, 8)}` }
        dispatch({ type: "resource/add", resource })
        return resource
      },
      updateResource: (resource: Resource) => dispatch({ type: "resource/update", resource }),

      createApplication: ({
        name,
        description,
        resourceIds,
      }: {
        name: string
        description?: string
        resourceIds: string[]
      }) => {
        const app: Application = {
          id: crypto.randomUUID(),
          name: cleanName(name),
          description: description?.trim() || undefined,
          resourceIds: [...new Set(resourceIds)],
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: "app/create", app })
        return app
      },
      updateApplication: (id: string, input: { name: string; description?: string }) =>
        dispatch({
          type: "app/update",
          id,
          name: cleanName(input.name),
          description: input.description?.trim() || undefined,
        }),
      addToApplication: (id: string, resourceIds: string[]) =>
        dispatch({ type: "app/addResources", id, resourceIds }),
      removeFromApplication: (id: string, resourceId: string) =>
        dispatch({ type: "app/removeResource", id, resourceId }),
      deleteApplication: (id: string) => dispatch({ type: "app/delete", id }),

      saveLayout: (appId: string, positions: Record<string, { x: number; y: number }>) =>
        dispatch({ type: "layout/save", appId, positions }),
      resetLayout: (appId: string) => dispatch({ type: "layout/reset", appId }),
    }),
    [],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      resourcesById,
      getApplication: (id) => state.applications.find((a) => a.id === id),
      applicationsFor: (resourceId) =>
        state.applications.filter((a) => a.resourceIds.includes(resourceId)),
      isApplicationNameTaken,
      isResourceNameTaken,
      ...actions,
      // Needs current state to capture what undo should restore, so it lives here, not in `actions`.
      deleteResource: (id) => {
        const resource = resourcesById.get(id)
        if (!resource) return () => {}
        const applicationIds = state.applications.filter((a) => a.resourceIds.includes(id)).map((a) => a.id)
        dispatch({ type: "resource/delete", id })
        return () => dispatch({ type: "resource/restore", resource, applicationIds })
      },
    }),
    [state, resourcesById, isApplicationNameTaken, isResourceNameTaken, actions],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
