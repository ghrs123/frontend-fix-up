import * as React from "react"

import { cn } from "@/lib/utils"
import { useDialogComposition } from "@/components/ui/dialog"
import { useComposition } from "@/hooks/useComposition"

function Textarea({
  className,
  onKeyDown,
  ...props
}: React.ComponentProps<"textarea">) {
  const isDialogComposing = useDialogComposition()
  const { isComposing, compositionProps } = useComposition()

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent actions during IME composition
      if (isComposing || isDialogComposing) {
        if (e.key === "Enter" || e.key === "Escape") {
          e.stopPropagation()
        }
      }
      onKeyDown?.(e)
    },
    [isComposing, isDialogComposing, onKeyDown]
  )

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onKeyDown={handleKeyDown}
      {...compositionProps}
      {...props}
    />
  )
}

export { Textarea }
