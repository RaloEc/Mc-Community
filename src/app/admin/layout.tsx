// src/app/admin/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
// Eliminamos la importación de useTheme que está causando problemas
import { ModeToggle } from '@/components/mode-toggle'
import {
  LayoutDashboard,
  Newspaper,
  Server,
  BookOpen,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  Image,
  Layers,
  Package,
  Download,
  RefreshCw
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Detectar tamaño de pantalla al cargar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Configuración inicial
    handleResize()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function checkAdmin() {
      try {
        // Usar el cliente del navegador para evitar problemas con localStorage
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/admin/login')
          return
        }

        // Verificar si el usuario es admin
        const { data } = await supabase
          .from('perfiles')
          .select('role, username')
          .eq('id', session.user.id)
          .single()

        if (data?.role !== 'admin') {
          router.push('/')
          return
        }

        setUsername(data.username || session.user.email || 'Admin')
        setIsAdmin(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Error al verificar permisos de administrador:', error)
        router.push('/admin/login')
      }
    }

    checkAdmin()
  }, [router])

  // Cerrar sidebar al cambiar de ruta en dispositivos móviles
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-950/95 dark:bg-amoled-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/noticias', label: 'Noticias', icon: Newspaper },
    { href: '/admin/servidores', label: 'Servidores', icon: Server },
    { href: '/admin/wiki', label: 'Wiki', icon: BookOpen },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/recursos', label: 'Recursos', icon: Package, subItems: [
      { href: '/admin/recursos/texturas', label: 'Texturas', icon: Image },
      { href: '/admin/recursos/shaders', label: 'Shaders', icon: Layers },
      { href: '/admin/recursos/mods', label: 'Mods', icon: Package }
    ]},
    { href: '/admin/sync', label: 'Sincronización', icon: RefreshCw, subItems: [
      { href: '/admin/sync/modrinth', label: 'Modrinth', icon: Download }
    ]}
  ]

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <>
      {/* Botón flotante para mostrar/ocultar sidebar en móvil - SIEMPRE visible */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-4 left-4 z-[45] lg:hidden bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
        aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {sidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay para cerrar el sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div className="fixed inset-0 bg-background dark:bg-gray-950 dark:bg-amoled-black pt-16 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            fixed top-16 left-0 bottom-0
            bg-muted/80 dark:bg-gray-950 dark:bg-amoled-black
            border-r border-border/40 dark:border-zinc-800/50
            flex flex-col
            z-40  
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
            overflow-hidden
          `}
        >
          <div className="p-4 border-b border-border/40 dark:border-zinc-800/50 min-w-64 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-foreground dark:text-white">Panel Admin</h1>
              <p className="text-sm text-muted-foreground dark:text-zinc-400">Hola, {username}</p>
            </div>
            <ModeToggle />
          </div>
          <nav className="flex-1 p-4 space-y-1 min-w-64">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.subItems && item.subItems.some(subItem => pathname === subItem.href))
              
              // Si el ítem tiene subítems, renderizamos un menú desplegable
              if (item.subItems) {
                return (
                  <div key={item.href} className="space-y-1">
                    <div 
                      className={`flex items-center px-3 py-2 rounded-md text-sm cursor-pointer ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground dark:text-zinc-300 hover:bg-accent/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className={`${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
                    </div>
                    
                    {/* Submenú */}
                    <div className="pl-6 space-y-1">
                      {item.subItems.map(subItem => {
                        const SubIcon = subItem.icon
                        const isSubActive = pathname === subItem.href
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${isSubActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground dark:text-zinc-300 hover:bg-accent/50 dark:hover:bg-zinc-800/30'
                            }`}
                          >
                            <SubIcon className="mr-2 h-4 w-4" />
                            <span className={`${!sidebarOpen && 'lg:hidden'}`}>{subItem.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              
              // Para ítems normales sin submenú
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground dark:text-slate-300 hover:bg-accent/50 dark:hover:bg-slate-800/70'
                    }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-border/40 dark:border-zinc-800/50 min-w-64 flex justify-end">
            <Button
              variant="destructive"
              size="icon"
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className={`h-[calc(100%-4rem)] overflow-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <main className="p-4 pt-2 md:p-6 md:pt-3 backdrop-blur-sm">
            <div className="bg-card/80 dark:bg-zinc-900/30 backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-border/40 dark:border-zinc-800/50">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}