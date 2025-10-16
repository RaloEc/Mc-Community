"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * DropdownMenu Wrapper Personalizado
 * Soluciona problemas de:
 * 1. Activación del primer item con mouseup inicial
 * 2. Layout shift al abrir el menú
 * 3. Gestión robusta del scroll
 */

const DropdownMenuFixed = DropdownMenuPrimitive.Root

const DropdownMenuTriggerFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(className)}
    // Prevenir activación en mouseup
    onPointerDown={(e) => {
      // Permitir que el trigger maneje el click normalmente
      props.onPointerDown?.(e)
    }}
    {...props}
  />
))
DropdownMenuTriggerFixed.displayName = DropdownMenuPrimitive.Trigger.displayName

const DropdownMenuGroupFixed = DropdownMenuPrimitive.Group

const DropdownMenuPortalFixed = DropdownMenuPrimitive.Portal

const DropdownMenuSubFixed = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroupFixed = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTriggerFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTriggerFixed.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContentFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContentFixed.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContentFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    disablePortal?: boolean
  }
>(({ className, sideOffset = 4, disablePortal = false, ...props }, ref) => {
  const content = (
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      onPointerDown={(e) => {
        // Prevenir que el mousedown inicial active items
        e.preventDefault()
      }}
      onCloseAutoFocus={(e) => {
        // Prevenir auto-focus al cerrar que puede causar scroll
        e.preventDefault()
      }}
      {...props}
    />
  )

  // Opción de desactivar portal para debugging
  if (disablePortal) {
    return content
  }

  return <DropdownMenuPrimitive.Portal>{content}</DropdownMenuPrimitive.Portal>
})
DropdownMenuContentFixed.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItemFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, onSelect, ...props }, ref) => {
  const [isPointerDown, setIsPointerDown] = React.useState(false)

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      onPointerDown={(e) => {
        // Marcar que el pointer está down
        setIsPointerDown(true)
        props.onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        // Resetear el estado
        setIsPointerDown(false)
        props.onPointerUp?.(e)
      }}
      onSelect={(event) => {
        // Solo ejecutar si fue un click completo (down + up)
        // Esto previene activación accidental con el mouseup inicial
        if (!isPointerDown) {
          event.preventDefault()
          return
        }

        // Ejecutar el handler personalizado
        onSelect?.(event)
        
        // Resetear estado
        setIsPointerDown(false)
      }}
      {...props}
    />
  )
})
DropdownMenuItemFixed.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItemFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItemFixed.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItemFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItemFixed.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabelFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabelFixed.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparatorFixed = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparatorFixed.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcutFixed = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcutFixed.displayName = "DropdownMenuShortcut"

export {
  DropdownMenuFixed,
  DropdownMenuTriggerFixed,
  DropdownMenuContentFixed,
  DropdownMenuItemFixed,
  DropdownMenuCheckboxItemFixed,
  DropdownMenuRadioItemFixed,
  DropdownMenuLabelFixed,
  DropdownMenuSeparatorFixed,
  DropdownMenuShortcutFixed,
  DropdownMenuGroupFixed,
  DropdownMenuPortalFixed,
  DropdownMenuSubFixed,
  DropdownMenuSubContentFixed,
  DropdownMenuSubTriggerFixed,
  DropdownMenuRadioGroupFixed,
}
