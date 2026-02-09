import * as React from "react"

/**
 * Hook to handle IME composition events for CJK language input.
 * Prevents form submission or other actions during IME composition.
 */
export function useComposition() {
  const [isComposing, setIsComposing] = React.useState(false)

  const handleCompositionStart = React.useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = React.useCallback(() => {
    setIsComposing(false)
  }, [])

  return {
    isComposing,
    handleCompositionStart,
    handleCompositionEnd,
    compositionProps: {
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    },
  }
}
