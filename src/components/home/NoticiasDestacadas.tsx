'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, Bell, Mail, Clock, Flame, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NoticiaMetaInfo } from '../noticias/NoticiaMetaInfo';
import { getExcerpt } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { useUserTheme } from '@/hooks/useUserTheme';

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  vistas: number;
  created_at: string;
  autor_nombre?: string;
  autor_avatar?: string;
  autor_color?: string;
  votos?: number;
  comentarios_count?: number;
  mi_voto?: number | null;
  categorias?: {
    categoria: {
      nombre: string;
      slug: string;
      color: string;
    };
  }[];
}

interface NoticiasDestacadasProps {
  className?: string;
}

interface TickerMessage {
  id: string;
  mensaje: string;
  activo: boolean;
  orden: number;
  noticia_id?: string | null;
  noticia?: {
    id: string;
    titulo: string;
    slug?: string;
    created_at: string;
  } | null;
}

// Componente de noticias en tiempo real
function NewsTicker() {
  const { userColor } = useUserTheme();
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickerMessages = async () => {
      try {
        const response = await fetch('/api/admin/news-ticker');
        if (response.ok) {
          const data = await response.json();
          // Filtrar solo mensajes activos y con contenido
          const activeMessages = data
            .filter((msg: any) => msg.activo && msg.mensaje?.trim())
            .sort((a: any, b: any) => a.orden - b.orden);
          
          if (activeMessages.length > 0) {
            setMessages(activeMessages);
          } else {
            // Mensajes predeterminados en caso de que no haya ninguno configurado
            setMessages([
              {
                id: 'default-1',
                mensaje: 'Bienvenido a la comunidad de Minecraft',
                activo: true,
                orden: 1
              },
              {
                id: 'default-2',
                mensaje: '¡Únete a nuestros eventos semanales!',
                activo: true,
                orden: 2
              },
              {
                id: 'default-3',
                mensaje: 'Explora los últimos mods y texturas',
                activo: true,
                orden: 3
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error al cargar el ticker de noticias:', error);
        // Mensajes de respaldo en caso de error
        setMessages([
          {
            id: 'error-1',
            mensaje: 'Bienvenido a la comunidad de Minecraft',
            activo: true,
            orden: 1
          },
          {
            id: 'error-2',
            mensaje: '¡Únete a nuestros eventos semanales!',
            activo: true,
            orden: 2
          },
          {
            id: 'error-3',
            mensaje: 'Explora los últimos mods y texturas',
            activo: true,
            orden: 3
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickerMessages();
    
    // Actualizar el ticker cada 5 minutos
    const interval = setInterval(fetchTickerMessages, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMessageClick = (message: TickerMessage) => {
    if (message.noticia) {
      // Abrir la noticia en una nueva pestaña
      window.open(`/noticias/${message.noticia.slug || message.noticia.id}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="hidden md:flex items-center text-white text-sm py-2 px-4 rounded-t-lg" style={{ background: `linear-gradient(to right, ${userColor}80, ${userColor}cc)` }}>
        <div className="flex items-center font-medium mr-4">
          <Bell className="h-4 w-4 mr-2" />
          <span>ÚLTIMAS NOTICIAS</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap">
            <span className="inline-block mr-8">Cargando noticias...</span>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return null; // No mostrar el ticker si no hay mensajes
  }

  return (
    <div className="hidden md:flex items-center text-white text-sm py-2 px-4 rounded-t-lg" style={{ background: `linear-gradient(to right, ${userColor}80, ${userColor}cc)` }}>
      <div className="flex items-center font-medium mr-4 whitespace-nowrap">
        <Bell className="h-4 w-4 mr-2" />
        <span>ÚLTIMAS NOTICIAS</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          {messages.map((message) => (
            <span 
              key={message.id} 
              className={`inline-block mr-8 ${message.noticia ? 'cursor-pointer hover:underline' : ''}`}
              onClick={() => message.noticia && handleMessageClick(message)}
              style={message.noticia ? { color: 'white' } : {}}
            >
              {message.mensaje}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de suscripción
function SubscriptionSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para suscribirse
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="hidden md:block bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-lg mt-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mantente actualizado</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Recibe las últimas noticias y actualizaciones directamente en tu bandeja de entrada</p>
        
        {subscribed ? (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
            ¡Gracias por suscribirte! Pronto recibirás nuestras noticias.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0"
              required
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Suscribirse
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function NoticiasDestacadas({ className = '' }: NoticiasDestacadasProps) {
  const { profile } = useAuth();
  const { userColor, getTextColor, getHoverTextColor } = useUserTheme();
  
  // Estilos dinámicos basados en el color del usuario
  const primaryColor = userColor || '#3b82f6'; // Azul por defecto
  
  // Función para ajustar el brillo del color según el modo
  const getAdjustedColor = (color: string, isDark: boolean) => {
    // Si es modo oscuro, aclaramos el color, si es modo claro, lo oscurecemos ligeramente
    return isDark 
      ? color.replace(/#(..)(..)(..)/, (_, r, g, b) => {
          // Aclarar el color para modo oscuro
          const factor = 1.4;
          const r2 = Math.min(255, Math.round(parseInt(r, 16) * factor)).toString(16).padStart(2, '0');
          const g2 = Math.min(255, Math.round(parseInt(g, 16) * factor)).toString(16).padStart(2, '0');
          const b2 = Math.min(255, Math.round(parseInt(b, 16) * factor)).toString(16).padStart(2, '0');
          return `#${r2}${g2}${b2}`;
        })
      : color;
  };

  // Usamos useState para manejar el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detectar el modo oscuro solo en el cliente
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Observar cambios en el tema
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  const adjustedPrimaryColor = getAdjustedColor(primaryColor, isDarkMode);
  
  const hoverStyles = {
    '--tw-ring-color': adjustedPrimaryColor,
    '--tw-ring-opacity': isDarkMode ? '0.2' : '0.1',
    '--tw-ring-offset-color': adjustedPrimaryColor,
    '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
    '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
    '--tw-ring': 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 0 #0000',
    '--tw-ring-inset': 'inset',
  } as React.CSSProperties;
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [ultimasNoticias, setUltimasNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'destacadas' | 'recientes' | 'populares'>('destacadas');

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        setLoading(true);
        // Obtener noticias destacadas
        const destacadasRes = await fetch('/api/noticias?limit=5&tipo=destacadas');
        const destacadasData = await destacadasRes.json();
        
        // Obtener últimas noticias para la barra lateral
        const ultimasRes = await fetch('/api/noticias?limit=4&tipo=recientes');
        const ultimasData = await ultimasRes.json();
        
        setNoticias(destacadasData.data || []);
        setUltimasNoticias(ultimasData.data || []);
      } catch (error) {
        console.error('Error fetching noticias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticias();
  }, []);

  const handleTabChange = async (tab: 'destacadas' | 'recientes' | 'populares') => {
    setActiveTab(tab);
    try {
      setLoading(true);
      const res = await fetch(`/api/noticias?limit=5&tipo=${tab}`);
      const data = await res.json();
      setNoticias(data.data || []);
    } catch (error) {
      console.error('Error al cambiar de pestaña:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && noticias.length === 0) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No hay noticias disponibles</h2>
        <p className="text-gray-600 dark:text-gray-300">Pronto tendremos nuevas noticias para ti</p>
      </div>
    );
  }

  // Extraer la noticia principal (primera del array)
  const noticiaPrincipal = noticias[0];
  const noticiasSecundarias = noticias.slice(1, 5);

  return (
    <div className={className}>
      {/* Ticker de noticias */}
      <NewsTicker />

      {/* Contenido principal */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden">
        {/* Encabezado con pestañas */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white py-4">
                Noticias
              </h2>
              
              {/* Pestañas de navegación (solo escritorio) */}
              <div className="hidden md:flex -mb-px space-x-8">
                <button
                  onClick={() => handleTabChange('destacadas')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'destacadas'
                      ? 'border-current text-current'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  style={activeTab === 'destacadas' ? { color: userColor, borderColor: userColor } : {}}
                >
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Destacadas
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('recientes')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recientes'
                      ? 'border-current text-current'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  style={activeTab === 'recientes' ? { color: userColor, borderColor: userColor } : {}}
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recientes
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('populares')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'populares'
                      ? 'border-current text-current'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  style={activeTab === 'populares' ? { color: userColor, borderColor: userColor } : {}}
                >
                  <div className="flex items-center">
                    <Flame className="h-4 w-4 mr-2" />
                    Populares
                  </div>
                </button>
              </div>

              <div className="hidden md:block">
                <Link href="/noticias">
                  <Button variant="outline" size="sm" className="group">
                    Ver todas <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Columna principal */}
            <div className="lg:w-2/3">
              {/* Noticia destacada */}
              {noticiaPrincipal && (
                <div className="mb-10">
                  <Link href={`/noticias/${noticiaPrincipal.id}`} className="block group">
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                      {noticiaPrincipal.imagen_url ? (
                        <img
                          src={noticiaPrincipal.imagen_url}
                          alt={noticiaPrincipal.titulo}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${userColor}10, ${userColor}20)` }}>
                          <div className="text-center text-gray-400 dark:text-gray-600">
                            <div className="text-6xl mb-2">📰</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <div>
                          <h3 className="text-white text-2xl font-bold mb-2 leading-tight">
                            {noticiaPrincipal.titulo}
                          </h3>
                          <p className="text-gray-200 line-clamp-2">
                            {getExcerpt(noticiaPrincipal.contenido, 200)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-gray-900 hover:bg-white text-xs font-medium">
                          Destacada
                        </Badge>
                      </div>
                    </div>
                    <div className="px-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {noticiaPrincipal.titulo}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {getExcerpt(noticiaPrincipal.contenido, 150)}
                      </div>
                      <NoticiaMetaInfo
                        autor_nombre={noticiaPrincipal.autor_nombre}
                        autor_avatar={noticiaPrincipal.autor_avatar}
                        created_at={noticiaPrincipal.created_at}
                        comentarios_count={noticiaPrincipal.comentarios_count}
                        className="text-sm"
                        userColor={profile?.color || null}
                      />
                    </div>
                  </Link>
                </div>
              )}

              {/* Grid de noticias secundarias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {noticiasSecundarias.map((noticia) => (
                  <div key={noticia.id} className="group">
                    <Link href={`/noticias/${noticia.id}`} className="block">
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                        {noticia.imagen_url ? (
                          <img
                            src={noticia.imagen_url}
                            alt={noticia.titulo}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <div className="text-center text-gray-400 dark:text-gray-600">
                              <div className="text-4xl">📰</div>
                            </div>
                          </div>
                        )}
                        <div 
    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    style={{
      backgroundColor: `hsl(var(--primary) / 0.1)`,
    }}
  ></div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm text-white text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            {noticia.vistas}
                          </Badge>
                        </div>
                      </div>
                      <div className="px-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {noticia.titulo}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                          {getExcerpt(noticia.contenido, 100)}
                        </p>
                        <NoticiaMetaInfo
                          autor_nombre={noticia.autor_nombre}
                          autor_avatar={noticia.autor_avatar}
                          created_at={noticia.created_at}
                          comentarios_count={noticia.comentarios_count}
                          className="text-xs"
                          userColor={profile?.color || null}
                        />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra lateral */}
            <div 
    className="lg:w-1/3 space-y-6"
    style={{
      '--primary': adjustedPrimaryColor,
      '--primary-foreground': isDarkMode ? 'hsl(210 20% 98%)' : 'hsl(210 40% 98%)',
      '--primary-hover': isDarkMode 
        ? `color-mix(in srgb, ${adjustedPrimaryColor} 10%, transparent)`
        : `color-mix(in srgb, ${adjustedPrimaryColor} 5%, transparent)`,
    } as React.CSSProperties}
  >
              <div 
                className="rounded-xl p-4 transition-colors duration-300"
                style={{
                  backgroundColor: `hsl(var(--primary) / 0.03)`,
                  border: `1px solid hsl(var(--primary) / 0.1)`,
                }}
              >
                <h3 
    className="font-bold text-foreground mb-4 flex items-center"
    style={{
      '--primary': userColor || 'hsl(221.2 83.2% 53.3%)',
    } as React.CSSProperties}
  >
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Últimas noticias
                </h3>
                <div className="space-y-4">
                  {ultimasNoticias.map((noticia) => (
                    <Link 
    key={noticia.id} 
    href={`/noticias/${noticia.id}`} 
    className={`block group rounded-lg p-1 -mx-1 transition-all duration-200 
      hover:bg-[--primary-hover] dark:hover:bg-[--primary-hover]`}
    style={hoverStyles}
  >
                      <div className="flex gap-3">
                        <div 
                          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: `hsl(var(--primary) / 0.1)`,
                          }}
                        >
                          {noticia.imagen_url ? (
                            <img
                              src={noticia.imagen_url}
                              alt={noticia.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                              <div className="text-2xl">📰</div>
                            </div>
                          )}
                        </div>
                        <div 
    className="flex-1 min-w-0 transition-all duration-200 group-hover:translate-x-1"
    style={{
      color: 'inherit',
      '--tw-text-opacity': '1',
    } as React.CSSProperties}
  >
                          <h4 
    className={`text-sm font-medium text-foreground 
      group-hover:text-[--primary] dark:group-hover:text-[--primary]
      transition-colors duration-200 line-clamp-2`}
  >
                            {noticia.titulo}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(noticia.created_at), 'dd MMM', { locale: es })}</span>
                            <span className="mx-1">•</span>
                            <span>{noticia.vistas} vistas</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link 
                    href="/noticias" 
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center"
                    style={{
                      '--primary': userColor || 'hsl(221.2 83.2% 53.3%)',
                    } as React.CSSProperties}
                  >
                    Ver todas las noticias <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Widget de categorías */}
              <div 
                className="rounded-xl p-4 transition-colors duration-300"
                style={{
                  backgroundColor: `hsl(var(--primary) / 0.03)`,
                  border: `1px solid hsl(var(--primary) / 0.1)`,
                }}
              >
                <h3 className="font-bold text-foreground mb-4">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { nombre: 'Actualizaciones', color: '#3b82f6' },
                    { nombre: 'Eventos', color: '#10b981' },
                    { nombre: 'Guias', color: '#f59e0b' },
                    { nombre: 'Comunidad', color: '#8b5cf6' },
                    { nombre: 'Trucos', color: '#ec4899' },
                    { nombre: 'Mods', color: '#f43f5e' },
                  ].map((categoria, index) => (
                    <Link
                      key={index}
                      href={`/noticias?categoria=${categoria.nombre.toLowerCase()}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-sm"
                      style={{
                        backgroundColor: `${categoria.color}15`,
                        color: categoria.color,
                        '--tw-ring-color': categoria.color,
                        '--tw-ring-opacity': '0.2',
                      } as React.CSSProperties}
                    >
                      {categoria.nombre}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de suscripción */}
      <SubscriptionSection />

      {/* Estilos para el efecto de marquesina */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
