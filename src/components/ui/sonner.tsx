
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// shadcn's toaster without next-themes, with rich colours mapped to the palette (see lib/notify).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      richColors
      // Resource names have no spaces, so long ones must be allowed to break.
      toastOptions={{ classNames: { title: "[overflow-wrap:anywhere]", description: "[overflow-wrap:anywhere]" } }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Rich colours, tuned to the app palette. Info is deliberately neutral.
          "--success-bg": "#eef8f1",
          "--success-border": "#bfe3cb",
          "--success-text": "#17603a",
          "--error-bg": "#fdf0ee",
          "--error-border": "#f3c6c0",
          "--error-text": "#a3241a",
          "--warning-bg": "#fdf6e7",
          "--warning-border": "#f0d9a6",
          "--warning-text": "#7a5604",
          "--info-bg": "var(--popover)",
          "--info-border": "var(--border)",
          "--info-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
