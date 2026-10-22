import { useCallback, useEffect, useRef, useState } from "react"
import type { PageSize } from "@/lib/pagination"
import type { ResourceFilters, SortState } from "@/lib/resources"
import { buildUrl, parseUrl, type UrlState, type View } from "@/lib/urlState"

const sameView = (a: View, b: View) =>
  a.kind === b.kind && (a.kind === "resources" || a.id === (b as { id: string }).id)

const readLocation = () => parseUrl(window.location.pathname, window.location.search)

/**
 * Two-way binding between UrlState and the address bar.
 * - Changing view pushes a history entry, so Back returns to where you were.
 * - Filter, sort and paging changes replace the entry: typing a search
 *   shouldn't leave one Back step per keystroke.
 * - Back/Forward re-reads the URL.
 * - The first render replaces a malformed URL with its cleaned-up form.
 */
export function useUrlState() {
  const [state, setState] = useState<UrlState>(readLocation)
  const lastView = useRef(state.view)
  const fromPopState = useRef(false)

  useEffect(() => {
    const url = buildUrl(state)
    const current = window.location.pathname + window.location.search
    const viewChanged = !sameView(lastView.current, state.view)
    lastView.current = state.view

    if (fromPopState.current) {
      // The browser already moved; just normalise the URL if it was malformed.
      fromPopState.current = false
      if (url !== current) window.history.replaceState(null, "", url)
      return
    }
    if (url === current) return
    if (viewChanged) window.history.pushState(null, "", url)
    else window.history.replaceState(null, "", url)
  }, [state])

  useEffect(() => {
    const onPop = () => {
      fromPopState.current = true
      setState(readLocation())
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const patch = useCallback((p: Partial<UrlState>) => setState((s) => ({ ...s, ...p })), [])

  return {
    ...state,
    setView: useCallback((view: View) => patch({ view }), [patch]),
    setFilters: useCallback((filters: ResourceFilters) => patch({ filters }), [patch]),
    setSort: useCallback((sort: SortState) => patch({ sort }), [patch]),
    setPage: useCallback((page: number) => patch({ page }), [patch]),
    setPageSize: useCallback((pageSize: PageSize) => patch({ pageSize }), [patch]),
  }
}
