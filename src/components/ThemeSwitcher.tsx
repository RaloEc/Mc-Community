'use client'

import { Sun, Moon, Smartphone, Contrast } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from './theme-provider'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'amoled', label: 'AMOLED', icon: Smartphone }
  ]

  const currentTheme = themes.find(t => t.id === theme) || themes[0]
  // const CurrentIcon = currentTheme.icon // CurrentIcon no se usa, se puede comentar o eliminar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themes.map(({ id, label, icon: Icon }) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(id as 'light' | 'amoled')}
            className={`flex items-center gap-2 ${theme === id ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
