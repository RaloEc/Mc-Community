'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ToolbarButtonProps {
  icon: React.ElementType
  onClick: (e: React.MouseEvent) => void
  isActive?: boolean
  title: string
  shortcut?: string
  disabled?: boolean
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon: Icon, 
  onClick, 
  isActive = false, 
  title, 
  shortcut,
  disabled = false
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClick(e)
            }}
            className={cn(
              "h-8 w-8 p-0 relative",
              isActive && "is-active", // Añadimos la clase is-active para los estilos globales
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            type="button"
            aria-pressed={isActive}
            aria-label={title}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}{shortcut && ` (${shortcut})`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ToolbarButton
