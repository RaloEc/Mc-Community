'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, ChevronDown, Home, Newspaper, Server, Package, PaintBucket, BookOpen, User, Settings, LogOut, Bell, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { createBrowserClient } from '@/utils/supabase-browser'
import { useAuth } from '@/context/AuthContext'
// No es necesario importar Image de Next.js

export default function Header() {
  const router = useRouter()
  const { session, loading: authLoading, user: authUser } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Si estamos cargando la autenticación, no hacemos nada aún
    if (authLoading) return;
    
    // Verificar si el usuario es admin cuando cambia el usuario autenticado
    if (authUser && session) {
      // Verificar si es admin basado en el rol del usuario
      setIsAdmin(authUser.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [authLoading, authUser, session])

  const handleLogout = async () => {
    try {
      // Primero limpiamos el almacenamiento local
      localStorage.removeItem('mc-community-auth')
      
      // Luego cerramos sesión en Supabase
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error al cerrar sesión:', error.message)
        return
      }
      
      // Actualizar el estado local inmediatamente
      setIsAdmin(false)
      
      // Redirigir solo después de un cierre de sesión exitoso
      router.refresh() // Actualiza el estado de la aplicación
      router.push('/')
    } catch (error) {
      console.error('Error inesperado al cerrar sesión:', error)
      // Intentamos limpiar todo en caso de error
      localStorage.removeItem('mc-community-auth')
      setIsAdmin(false)
      router.refresh()
      router.push('/')
    }
  }

  return (
    <header className="bg-background dark:bg-amoled-black sticky top-0 z-40 border-b border-border/40 dark:border-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 md:flex md:items-center md:gap-12">
            <Link className="block" href="/">
              <span className="sr-only">Inicio</span>
              <img 
                src="/images/logo.png" 
                alt="MC Community Logo" 
                className="h-10 w-10" 
              />
            </Link>
          </div>

          <div className="md:flex md:items-center md:gap-12">
            <nav aria-label="Global" className="hidden md:block">
              <ul className="flex items-center gap-1 text-sm">
                <li>
                  <Link
                    href="/noticias"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Noticias
                  </Link>
                </li>
                <li>
                  <Link
                    href="/servidores"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Servidores
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mods"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Mods
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recursos/texturas"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Texturas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recursos/shaders"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Shaders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wiki"
                    className="px-4 py-2 text-gray-300 transition hover:text-white dark:text-gray-300 dark:hover:text-white border-b-2 border-transparent hover:border-primary"
                  >
                    Wiki
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className="px-4 py-2 text-primary transition hover:text-primary/75 dark:text-primary dark:hover:text-primary/75 border-b-2 border-transparent hover:border-primary"
                    >
                      Panel Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              <ModeToggle />
              
              {/* Auth Buttons - Desktop */}
              <div className="hidden md:flex items-center gap-4">
                <button className="text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </button>
                
                {authLoading ? (
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                ) : session && authUser ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="overflow-hidden rounded-full border border-gray-700 shadow-inner"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <span className="sr-only">Abrir menú de usuario</span>
                      {authUser.avatar_url ? (
                        <div className="size-8 overflow-hidden">
                          <img 
                            src={authUser.avatar_url} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover rounded-full"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        <div className="size-8 flex items-center justify-center bg-primary text-white font-bold rounded-full">
                          {authUser.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </button>

                    {isMenuOpen && (
                      <>
                        {/* Overlay para cerrar el menú al hacer clic fuera */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <div
                          className="absolute end-0 z-20 mt-2 w-64 rounded-md border border-gray-800 bg-amoled-black/90 backdrop-blur-sm shadow-lg"
                          role="menu"
                        >
                          <div className="p-0">
                            <div className="flex items-center px-6 py-4 border-b border-gray-800/50">
                            {authUser.avatar_url ? (
                              <div className="size-8 overflow-hidden rounded-full mr-3">
                                <img 
                                  src={authUser.avatar_url} 
                                  alt="Foto de perfil" 
                                  className="w-full h-full object-cover object-center"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ) : (
                              <div className="size-8 flex items-center justify-center bg-primary text-white font-bold rounded-full mr-3">
                                {authUser.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white">
                                {authUser.username || 'Usuario'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {authUser.email}
                              </span>
                            </div>
                            </div>
                            <Link
                              href="/perfil"
                              className="flex items-center gap-3 text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                              role="menuitem"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Mi Perfil
                            </Link>
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left text-sm font-medium text-red-500 hover:text-red-400 px-6 py-3 hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                              role="menuitem"
                            >
                              <LogOut className="h-4 w-4" />
                              Cerrar Sesión
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="border-minecraft-diamond text-minecraft-diamond hover:bg-minecraft-diamond/10">Iniciar Sesión</Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">Registrarse</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="block md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menú principal"
                  aria-expanded={isMenuOpen}
                  className="text-primary dark:text-primary p-1"
                >
                  <span className="sr-only">Abrir menú</span>
                  {isMenuOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menú móvil expandible */}
      {isMenuOpen && (
        <>
          {/* Overlay semitransparente */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity duration-300 ease-in-out"
            onClick={() => setIsMenuOpen(false)}
          />
          
          <div 
            className="md:hidden fixed right-0 top-0 w-72 h-full overflow-y-auto bg-background dark:bg-amoled-black border-l border-border/40 dark:border-gray-800 shadow-lg z-[100] transition-all duration-300 ease-in-out transform translate-x-0"
            style={{
              animation: 'slideInRight 0.3s ease-out forwards'
            }}
          >
            <div className="p-0">
            <nav className="flex flex-col h-full">
              <style jsx global>{`
                @keyframes slideInRight {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>
              <div className="pt-6 p-4 pb-2 flex items-center justify-between border-b border-gray-800/50">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                    <img 
                      src="/images/logo.png" 
                      alt="MC Community Logo" 
                      className="h-10 w-10" 
                    />
                  </Link>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/30 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="py-2">
                <h3 className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navegación</h3>
              </div>
              
              <Link
                href="/noticias"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Newspaper className="h-4 w-4" />
                Noticias
              </Link>
              <Link
                href="/servidores"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Server className="h-4 w-4" />
                Servidores
              </Link>
              <Link
                href="/recursos/mods"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="h-4 w-4" />
                Mods
              </Link>
              <Link
                href="/recursos/texturas"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <PaintBucket className="h-4 w-4" />
                Texturas
              </Link>
              <Link
                href="/recursos/shaders"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <PaintBucket className="h-4 w-4" />
                Shaders
              </Link>
              <Link
                href="/wiki"
                className="text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Wiki
              </Link>
              
              {isAdmin && (
                <>
                  <div className="py-2 mt-2">
                    <h3 className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administración</h3>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-medium text-primary hover:text-primary/80 px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Panel Admin
                  </Link>
                </>
              )}
              
              <div className="mt-auto border-t border-gray-800/50">
                <div className="py-2">
                  <h3 className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tu cuenta</h3>
                </div>
                {authLoading ? (
                  <div className="flex flex-col space-y-2 p-4">
                    <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                ) : authUser && session ? (
                  <>
                    <div className="flex items-center px-6 py-4 border-b border-gray-800/50">
                      {authUser.avatar_url ? (
                        <div className="size-8 overflow-hidden rounded-full mr-3">
                          <img 
                            src={authUser.avatar_url} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover object-center"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        <div className="size-8 flex items-center justify-center bg-primary text-white font-bold rounded-full mr-3">
                          {authUser.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {authUser.username || 'Usuario'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {authUser.email}
                        </span>
                      </div>
                      <div className="ml-auto">
                        <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800/30 transition-colors">
                          <Bell className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Mi Perfil
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 text-sm font-medium text-white hover:text-primary px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-sm font-medium text-red-500 hover:text-red-400 px-6 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col p-4 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center border-minecraft-diamond text-minecraft-diamond hover:bg-minecraft-diamond/10"
                      onClick={() => {
                        router.push('/login');
                        setIsMenuOpen(false);
                      }}
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      size="sm"
                      className="w-full justify-center bg-primary hover:bg-primary/90"
                      onClick={() => {
                        router.push('/register');
                        setIsMenuOpen(false);
                      }}
                    >
                      Registrarse
                    </Button>
                  </div>
                )}
              </div>
            </nav>
            </div>
          </div>
        </>
      )}
    </header>
  )
}