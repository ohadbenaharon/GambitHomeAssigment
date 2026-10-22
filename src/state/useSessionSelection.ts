import { useEffect, useMemo, useState } from "react"

const KEY = "gambit.selection.v1"

function read(): ReadonlySet<string> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "[]")
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [])
  } catch {
    return new Set()
  }
}

/**
 * The table selection survives a refresh in the same tab (sessionStorage),
 * but isn't shared between tabs or put in the URL: it's work in progress, not
 * something to link to.
 *
 * Ids that no longer exist (deleted here or in another tab) are filtered out
 * on every render, so counts and "Create application" never include ghosts.
 */
export function useSessionSelection(exists: (id: string) => boolean) {
  const [raw, setSelected] = useState<ReadonlySet<string>>(read)

  const selected = useMemo(() => {
    const valid = [...raw].filter(exists)
    return valid.length === raw.size ? raw : new Set(valid)
  }, [raw, exists])

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify([...selected]))
    } catch {
      // Storage blocked: selection simply won't survive a refresh.
    }
  }, [selected])

  return [selected, setSelected] as const
}
