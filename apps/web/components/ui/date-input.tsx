'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const DateInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, onClick, onFocus, ...props }, ref) => {
    const triggerPicker = (el: HTMLInputElement | null) => {
      try {
        el?.showPicker()
      } catch {
        // showPicker() may throw in some environments; ignore
      }
    }

    return (
      <input
        type="date"
        ref={ref}
        onClick={(e) => {
          triggerPicker(e.currentTarget)
          onClick?.(e)
        }}
        onFocus={(e) => {
          triggerPicker(e.currentTarget)
          onFocus?.(e)
        }}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm cursor-pointer transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
DateInput.displayName = 'DateInput'

export { DateInput }
