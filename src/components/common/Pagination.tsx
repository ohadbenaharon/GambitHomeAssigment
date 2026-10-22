import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZES, type Page, type PageSize } from "@/lib/pagination"

interface PaginationProps {
  page: Page<unknown>
  pageSize: PageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  /** Singular; pluralised with a trailing "s". */
  noun?: string
}

export function Pagination({ page, pageSize, onPageChange, onPageSizeChange, noun = "resource" }: PaginationProps) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
      <span aria-live="polite">
        {page.total === 0
          ? `No ${noun}s`
          : `${page.from === page.to ? page.from : `${page.from}–${page.to}`} of ${page.total} ${page.total === 1 ? noun : `${noun}s`}`}
      </span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          Rows per page
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}>
            <SelectTrigger size="sm" className="bg-card h-8 w-[72px] text-xs" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-1 tabular-nums">
            Page {page.page + 1} of {page.pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="bg-card size-8"
            onClick={() => onPageChange(page.page - 1)}
            disabled={page.page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-card size-8"
            onClick={() => onPageChange(page.page + 1)}
            disabled={page.page >= page.pageCount - 1}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
