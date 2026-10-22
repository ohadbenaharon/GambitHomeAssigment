import { Trash2 } from "lucide-react"
import { createElement } from "react"
import { toast, type ExternalToast } from "sonner"

/**
 * One place that decides a toast's colour from what happened, so call sites
 * say what happened instead of picking a colour:
 * - success (green): something was created, added or saved
 * - removed (red): something was removed or deleted
 * - info (neutral): nothing changed, e.g. the resources were already members
 */
export const notify = {
  success: (title: string, options?: ExternalToast) => toast.success(title, options),
  removed: (title: string, options?: ExternalToast) =>
    toast.error(title, { icon: createElement(Trash2, { className: "size-4" }), ...options }),
  info: (title: string, options?: ExternalToast) => toast.info(title, options),
}
