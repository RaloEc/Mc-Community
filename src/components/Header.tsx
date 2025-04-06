'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { ChevronDown, Menu } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-amoled-black dark:border-blue-900/20 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M14 11h4"></path>
            <path d="M14 15h4"></path>
            <path d="M11 15v-3.5a1.5 1.5 0 0 0-3 0V15"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          </svg>
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            MC Community
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/noticias"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Noticias
          </Link>
          <Link
            href="/servidores"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Servidores
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Recursos
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute top-full left-0 z-50 mt-2 hidden w-48 rounded-md border bg-popover p-2 shadow-md group-hover:block dark:bg-amoled-gray dark:border-blue-900/20 dropdown-animation">
              <Link href="/recursos/mods" className="block rounded-sm px-3 py-2 text-sm hover:bg-accent">
                Mods
              </Link>
              <Link href="/recursos/texturas" className="block rounded-sm px-3 py-2 text-sm hover:bg-accent">
                Paquetes de Texturas
              </Link>
              <Link href="/recursos/shaders" className="block rounded-sm px-3 py-2 text-sm hover:bg-accent">
                Shaders
              </Link>
              <Link href="/wiki" className="block rounded-sm px-3 py-2 text-sm hover:bg-accent">
                Wiki
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex border-minecraft-diamond text-minecraft-diamond hover:bg-minecraft-diamond/10"
          >
            Iniciar Sesión
          </Button>
          <Button size="sm" className="hidden sm:inline-flex bg-primary hover:bg-primary/90">
            Registrarse
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menú principal"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Abrir menú</span>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Menú móvil expandible */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 dark:border-blue-900/20 animate-fadeIn">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/noticias"
                className="text-sm font-medium text-foreground hover:text-primary px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Noticias
              </Link>
              <Link
                href="/servidores"
                className="text-sm font-medium text-foreground hover:text-primary px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Servidores
              </Link>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground px-2 py-1.5">
                  Recursos
                </p>
                <div className="pl-4 space-y-2 border-l-2 border-border dark:border-blue-900/40">
                  <Link
                    href="/recursos/mods"
                    className="text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mods
                  </Link>
                  <Link
                    href="/recursos/texturas"
                    className="text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Paquetes de Texturas
                  </Link>
                  <Link
                    href="/recursos/shaders"
                    className="text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Shaders
                  </Link>
                  <Link
                    href="/wiki"
                    className="text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Wiki
                  </Link>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border dark:border-blue-900/20 flex flex-col space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-center border-minecraft-diamond text-minecraft-diamond hover:bg-minecraft-diamond/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  className="w-full justify-center bg-primary hover:bg-primary/90"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrarse
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
