'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const ButtonGroupContext = React.createContext(false)

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "div"
    const isChildGroup = React.useContext(ButtonGroupContext)

    return (
      <ButtonGroupContext.Provider value={true}>
        <Component
          ref={ref}
          role="group"
          className={cn(
            "flex flex-wrap items-center gap-2",
            "md:inline-flex md:flex-nowrap md:gap-0 md:rounded-md md:border md:border-border md:bg-muted/30 md:p-1 md:shadow-sm",
            "md:[&_[data-button-group-item]]:rounded-none",
            "md:[&_[data-button-group-item]:first-child]:rounded-l-md",
            "md:[&_[data-button-group-item]:last-child]:rounded-r-md",
            "md:[&_[data-button-group-item]]:border md:[&_[data-button-group-item]]:border-border",
            "md:[&_[data-button-group-item]:not(:first-child)]:border-l-0",
            isChildGroup && "md:shadow-none md:border-0 md:bg-transparent md:p-0",
            className
          )}
          {...props}
        />
      </ButtonGroupContext.Provider>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
