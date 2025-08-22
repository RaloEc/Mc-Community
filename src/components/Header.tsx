'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/utils/avatar-utils';
import { Menu, Newspaper, Package, User, LogOut, Shield, MessageSquare } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { session, user: authUser, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLLIElement | null>(null)
  // Foro menu state
  const [isForoMenuOpen, setIsForoMenuOpen] = useState(false)
  const foroMenuRef = useRef<HTMLLIElement | null>(null)
  type ForoCategoria = {
    id: string
    nombre: string
    slug: string
    parent_id: string | null
    nivel: number | null
    color: string | null
    subcategorias?: ForoCategoria[]
  }
  type ApiForoCategoria = {
    id: string
    nombre: string
    slug: string
    parent_id: string | null
    nivel: number | null
    color: string | null
  }
  const [foroCategorias, setForoCategorias] = useState<ForoCategoria[]>([])
  const [foroMobileOpen, setForoMobileOpen] = useState(false)

  useEffect(() => {
    const detectTheme = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('amoled')) {
        setCurrentTheme('amoled');
      } else if (htmlElement.classList.contains('dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('light');
      }
    };

    detectTheme();
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [])

  useEffect(() => {
    if (authUser && session) {
      setIsAdmin(authUser.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [authUser, session])

  // Cerrar submenú Admin al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setIsAdminMenuOpen(false)
      }
      if (foroMenuRef.current && !foroMenuRef.current.contains(e.target as Node)) {
        setIsForoMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cargar categorías de foro y construir jerarquía
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/foro/categorias')
        if (!res.ok) return
        const json = await res.json()
        const flat: ForoCategoria[] = ((json?.data || []) as ApiForoCategoria[]).map((c) => ({
          id: c.id,
          nombre: c.nombre,
          slug: c.slug,
          parent_id: c.parent_id ?? null,
          nivel: c.nivel ?? 0,
          color: c.color ?? null,
        }))
        const map = new Map<string, ForoCategoria>()
        flat.forEach(c => map.set(c.id, { ...c, subcategorias: [] }))
        const roots: ForoCategoria[] = []
        flat.forEach(c => {
          if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.subcategorias!.push(map.get(c.id)!)
          } else {
            roots.push(map.get(c.id)!)
          }
        })
        setForoCategorias(roots)
      } catch (e) {
        // noop
      }
    }
    fetchCategorias()
  }, [])

  const handleLogout = async () => {
    console.log('[Header] handleLogout: inicio')
    try {
      await logout()
      console.log('[Header] handleLogout: logout() del contexto OK')
    } catch (e) {
      console.warn('[Header] handleLogout: error en logout() del contexto, intento fallback directo', e)
      try {
        const sb = createClient()
        await sb.auth.signOut()
        console.log('[Header] handleLogout: fallback signOut OK')
      } catch (e2) {
        console.error('[Header] handleLogout: fallback signOut falló', e2)
      }
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session_cache')
        localStorage.removeItem('auth_user_cache')
      }
    } catch {}
    setIsUserMenuOpen(false)
    setIsMenuOpen(false)
    try { router.push('/login') } catch {}
    try { router.refresh() } catch {}
  }

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsAdminMenuOpen(false);
  }

  return (
    <header className="bg-background dark:bg-amoled-black sticky top-0 z-50 border-b border-border/40 dark:border-gray-800 text-gray-900 dark:text-white amoled:text-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 md:flex md:items-center md:gap-12">
            <Link className="block" href="/" onClick={closeAllMenus}>
              <span className="sr-only">Inicio</span>
              <img src="/images/logo.png" alt="MC Community Logo" className="h-10 w-10" />
            </Link>
          </div>

          <div className="md:flex md:items-center md:gap-12">
            <nav aria-label="Global" className="hidden md:block">
              <ul className="flex items-center gap-1 text-sm">
                <li><Link href="/noticias" className={`px-4 py-2 transition hover:text-primary ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Noticias</Link></li>
                <li className="relative" ref={foroMenuRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isForoMenuOpen}
                    className={`px-4 py-2 transition hover:text-primary ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}
                    onClick={() => setIsForoMenuOpen(v => !v)}
                  >
                    Foro
                  </button>
                  <div
                    className={`absolute ${isForoMenuOpen ? 'block' : 'hidden'} top-full left-0 mt-1 w-72 rounded-md border shadow-lg ${currentTheme === 'light' ? 'bg-white border-gray-200' : 'bg-black border-gray-700'}`}
                  >
                    <ul className="py-2 text-sm max-h-[70vh] overflow-auto">
                      <li>
                        <Link
                          href="/foro"
                          className={`block px-4 py-2 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                          onClick={() => setIsForoMenuOpen(false)}
                        >
                          Ver todo el foro
                        </Link>
                      </li>
                      {foroCategorias.map(cat => (
                        <li key={cat.id} className="px-2 py-1">
                          <Link
                            href={`/foro/categoria/${cat.slug}`}
                            className={`block rounded px-2 py-1 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                            onClick={() => setIsForoMenuOpen(false)}
                            style={cat.color ? { borderLeft: `3px solid ${cat.color}` } : undefined}
                          >
                            {cat.nombre}
                          </Link>
                          {cat.subcategorias && cat.subcategorias.length > 0 && (
                            <ul className="mt-1 ml-3 border-l border-gray-200 dark:border-gray-700">
                              {cat.subcategorias.map(sub => (
                                <li key={sub.id}>
                                  <Link
                                    href={`/foro/categoria/${sub.slug}`}
                                    className={`block rounded px-2 py-1 ml-2 ${currentTheme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-800'}`}
                                    onClick={() => setIsForoMenuOpen(false)}
                                  >
                                    {sub.nombre}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                {isAdmin && (
                  <li className="relative" ref={adminMenuRef}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isAdminMenuOpen}
                      className={`px-4 py-2 transition hover:text-primary ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}
                      onClick={() => setIsAdminMenuOpen((v) => !v)}
                    >
                      Admin
                    </button>
                    <div
                      className={`absolute ${isAdminMenuOpen ? 'block' : 'hidden'} top-full left-0 mt-1 w-56 rounded-md border shadow-lg ${currentTheme === 'light' ? 'bg-white border-gray-200' : 'bg-black border-gray-700'}`}
                    >
                      <ul className="py-2 text-sm">
                        <li>
                          <Link
                            href="/admin/dashboard"
                            className={`block px-4 py-2 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/noticias"
                            className={`block px-4 py-2 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Admin Noticias
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/usuarios"
                            className={`block px-4 py-2 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Admin Usuarios
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/foro"
                            className={`block px-4 py-2 ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Admin Foros
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </li>
                )}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              <ModeToggle />
              
              <div className="hidden md:flex items-center gap-4">
                {authUser ? (
                  <div className="relative">
                    <button type="button" className="overflow-hidden rounded-full border border-gray-700 shadow-inner" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                      <span className="sr-only">Abrir menú de usuario</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={authUser.avatar_url || undefined} alt={authUser.username || 'Usuario'} />
                        <AvatarFallback>{getUserInitials(authUser.username, 1, 'U')}</AvatarFallback>
                      </Avatar>
                    </button>
                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                        <div className={`absolute end-0 z-20 mt-2 w-64 rounded-md border shadow-lg ${currentTheme === 'light' ? 'bg-white border-gray-200' : 'bg-black border-gray-700'}`}>
                          <div className="p-2">
                             <div className={`flex items-center px-4 py-3 border-b mb-2 ${currentTheme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                                <div className="flex-1">
                                  <span className={`font-medium ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>{authUser.username || 'Usuario'}</span>
                                  <span className={`block text-xs ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{authUser.email}</span>
                                </div>
                             </div>
                            <Link href="/perfil" className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={() => setIsUserMenuOpen(false)}><User className="h-4 w-4" />Mi Perfil</Link>
                            <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg hover:bg-red-500/10 w-full text-left mt-2 text-red-500"><LogOut className="h-4 w-4" />Cerrar sesión</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" onClick={closeAllMenus}><Button variant="outline" size="sm">Iniciar Sesión</Button></Link>
                    <Link href="/register" onClick={closeAllMenus}><Button size="sm">Registrarse</Button></Link>
                  </div>
                )}
              </div>

              <div className="block md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menú principal">
                  <Menu />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)} />
      )}
      
      <div className={`md:hidden fixed right-0 top-0 w-72 h-full overflow-y-auto shadow-lg z-50 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} ${currentTheme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'} amoled:text-white`}>
        <nav className="flex flex-col h-full">
          <div className={`p-4 border-b ${currentTheme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
            {authUser ? (
              <div className="flex items-center">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={authUser.avatar_url || undefined} alt={authUser.username || 'Usuario'} />
                  <AvatarFallback>{getUserInitials(authUser.username, 1, 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{authUser.username}</span>
                  <span className="text-xs text-muted-foreground">{authUser.role}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={closeAllMenus}><Button variant="outline" className="w-full">Iniciar Sesión</Button></Link>
                <Link href="/register" onClick={closeAllMenus}><Button className="w-full">Registrarse</Button></Link>
              </div>
            )}
          </div>

          <ul className="flex-grow p-4 space-y-2">
            <li>
              <Link href="/noticias" className={`flex items-center gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                <Newspaper size={18} /> Noticias
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`}
                onClick={() => setForoMobileOpen(v => !v)}
              >
                <span className="flex items-center gap-2"><MessageSquare size={18} /> Foro</span>
                <span className="text-xs">{foroMobileOpen ? '−' : '+'}</span>
              </button>
              {foroMobileOpen && (
                <div className="mt-1 ml-2">
                  <Link href="/foro" className={`block p-2 rounded-md text-sm ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                    Ver todo el foro
                  </Link>
                  {foroCategorias.map(cat => (
                    <div key={cat.id} className="mt-1">
                      <Link
                        href={`/foro/categoria/${cat.slug}`}
                        className={`block rounded px-3 py-2 text-sm ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-800'}`}
                        onClick={closeAllMenus}
                      >
                        {cat.nombre}
                      </Link>
                      {cat.subcategorias && cat.subcategorias.length > 0 && (
                        <div className="ml-3">
                          {cat.subcategorias.map(sub => (
                            <Link
                              key={sub.id}
                              href={`/foro/categoria/${sub.slug}`}
                              className={`block rounded px-3 py-1.5 text-sm ${currentTheme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}
                              onClick={closeAllMenus}
                            >
                              {sub.nombre}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          </ul>

          {isAdmin && (
            <div className={`p-4 border-t ${currentTheme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <p className={`text-sm font-semibold mb-2 ${currentTheme === 'light' ? 'text-gray-500' : 'text-gray-400'} amoled:text-gray-300`}>Administración</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/admin/dashboard" className={`flex items-center gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                    <Shield size={18} /> Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/admin/foro" className={`flex items-center gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                    <MessageSquare size={18} /> Admin Foro
                  </Link>
                </li>
                <li>
                  <Link href="/admin/noticias" className={`flex items-center gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                    <Newspaper size={18} /> Admin Noticias
                  </Link>
                </li>
                <li>
                  <Link href="/admin/usuarios" className={`flex items-center gap-2 p-2 rounded-md ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}>
                    <User size={18} /> Admin Usuarios
                  </Link>
                </li>
                
              </ul>
            </div>
          )}

          {authUser && (
            <div className={`p-4 border-t ${currentTheme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <Link href="/perfil" className={`flex items-center gap-2 p-2 rounded-md w-full text-left ${currentTheme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-800'}`} onClick={closeAllMenus}><User size={18} /> Mi Perfil</Link>
              <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-md hover:bg-red-500/10 w-full text-left mt-2 text-red-500"><LogOut size={18} /> Cerrar Sesión</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}