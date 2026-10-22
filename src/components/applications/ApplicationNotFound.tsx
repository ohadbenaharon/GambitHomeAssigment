import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ApplicationNotFound({ onBrowseResources }: { onBrowseResources: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <SearchX className="text-muted-foreground size-7" />
      <div>
        <h1 className="text-lg font-semibold">This application doesn't exist</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          It may have been deleted, or the link is incomplete. Applications are saved in this browser
          only, so links don't work across browsers or devices.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onBrowseResources}>
        Go to Resources
      </Button>
    </div>
  )
}
