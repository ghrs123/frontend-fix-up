

# Plan: Update UI Components

## Overview
Replace 5 UI components with modern versions that include improved accessibility, better dark mode support, and enhanced styling.

## Components to Update

### 1. Tabs Component
- Add `data-slot` attributes for accessibility
- Convert to function syntax (from forwardRef)
- Add gap and flex-col layout
- Update dark mode styles for triggers

### 2. Toggle Component
- Add SVG pointer-events handling
- Improve focus-visible states with ring-3
- Add shadow-xs to outline variant
- Update size variants to new values

### 3. Toggle Group Component
- Add `data-slot`, `data-variant`, `data-size` attributes
- Update styling with rounded-md and shadow-xs
- Convert to function syntax

### 4. Tooltip Component
- Wrap in TooltipProvider automatically
- Add arrow to tooltip content
- Change background to foreground color scheme
- Update default sideOffset to 0

### 5. Textarea Component
The uploaded version includes IME composition handling for CJK languages, but requires:
- Creating `useComposition` hook
- Adding `useDialogComposition` context to Dialog

**Simplified approach:** Update styling to match modern patterns without IME complexity (can be added later if needed for CJK support)

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useComposition.ts` | Handle IME composition events |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/ui/tabs.tsx` | Replace with modern version |
| `src/components/ui/toggle.tsx` | Replace with modern version |
| `src/components/ui/toggle-group.tsx` | Replace with modern version |
| `src/components/ui/tooltip.tsx` | Replace with modern version |
| `src/components/ui/textarea.tsx` | Update styling (simplified version) |
| `src/components/ui/dialog.tsx` | Add composition context for IME support |

## Implementation Steps

1. **Update simple components first**
   - Replace tabs.tsx with new version
   - Replace toggle.tsx with new version
   - Replace toggle-group.tsx with new version
   - Replace tooltip.tsx with new version

2. **Create composition hook**
   - Create `useComposition.ts` for IME handling

3. **Update dialog with composition context**
   - Add `DialogCompositionContext` and `useDialogComposition`

4. **Update textarea**
   - Replace with full IME-aware version

## Testing Recommendations
After implementation, test the Admin page which uses Tabs, Dialog, and Textarea extensively to ensure all components work correctly together.

