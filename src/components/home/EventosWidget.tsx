'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserTheme } from '@/hooks/useUserTheme';
import IconMorphButton from './IconMorphButton';
import createClient from '@/utils/supabase/client';

// URL base de Supabase Storage
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_BUCKET = 'iconos'; // Nombre del bucket en Supabase Storage

// Tipos de datos
interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  tipo: 'actualizacion' | 'parche' | 'evento' | 'torneo';
  juego_nombre?: string;
  imagen_url?: string;
  icono_url?: string;
  url?: string;
  estado: 'borrador' | 'publicado' | 'cancelado';
  creador_id?: string;
  creado_en?: string;
  actualizado_en?: string;
  publicado_en?: string;
}

interface EventosWidgetProps {
  className?: string;
}

// Datos de prueba fallback (en caso de error al cargar)
const eventosDemo: Evento[] = [
  {
    id: '1',
    titulo: 'Actualización DeltaForce 2.5',
    descripcion: 'Nueva actualización con mapas y armas',
    fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'actualizacion',
    juego_nombre: 'DeltaForce',
    imagen_url: 'https://via.placeholder.com/50',
    estado: 'publicado'
  },
  {
    id: '2',
    titulo: 'Parche de seguridad Minecraft',
    descripcion: 'Corrección de vulnerabilidades críticas',
    fecha: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'parche',
    juego_nombre: 'Minecraft',
    imagen_url: 'https://via.placeholder.com/50',
    estado: 'publicado'
  },
  {
    id: '3',
    titulo: 'Torneo semanal de PvP',
    descripcion: 'Competencia con premios para los ganadores',
    fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'torneo',
    juego_nombre: 'Minecraft',
    imagen_url: 'https://via.placeholder.com/50',
    estado: 'publicado'
  },
  {
    id: '4',
    titulo: 'Evento especial de Halloween',
    descripcion: 'Misiones y recompensas temáticas',
    fecha: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'evento',
    juego_nombre: 'Varios juegos',
    imagen_url: 'https://via.placeholder.com/50',
    estado: 'publicado'
  },
  {
    id: '5',
    titulo: 'Actualización de contenido',
    descripcion: 'Nuevos items y misiones',
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'actualizacion',
    juego_nombre: 'Skyblock',
    imagen_url: 'https://via.placeholder.com/50',
    estado: 'publicado'
  }
];

// Iconos para los tipos de eventos
const tipoEventoIcon: Record<string, JSX.Element> = {
  actualizacion: <Clock className="h-3 w-3 mr-1" />,
  parche: <Clock className="h-3 w-3 mr-1" />,
  evento: <Calendar className="h-3 w-3 mr-1" />,
  torneo: <Calendar className="h-3 w-3 mr-1" />
};

export default function EventosWidget({ className = '' }: EventosWidgetProps) {
  const { userColor } = useUserTheme();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Cargar datos desde Supabase
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Obtener eventos publicados y ordenados por fecha
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('estado', 'publicado')
          .gte('fecha', new Date().toISOString())
          .order('fecha', { ascending: true })
          .limit(10);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setEventos(data);
        } else {
          // Si no hay eventos en Supabase, usar datos de prueba
          console.log('No se encontraron eventos en la base de datos, usando datos de prueba');
          setEventos(eventosDemo);
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        // En caso de error, usar datos de prueba
        setEventos(eventosDemo);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  // Ordenar eventos por fecha
  const eventosFuturos = eventos
    .filter(e => new Date(e.fecha) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Generar días del mes actual para la vista de calendario
  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Función para obtener eventos de un día específico
  const getEventosDelDia = (dia: Date) => {
    return eventos.filter(evento => 
      isSameDay(new Date(evento.fecha), dia)
    );
  };

  // Componente de carga
  if (loading) {
    return (
      <div className={`rounded-xl p-4 border border-gray-200 dark:border-gray-800 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl p-4 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: `hsl(var(--primary) / 0.03)`,
        border: `1px solid hsl(var(--primary) / 0.1)`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="font-bold text-foreground flex items-center"
          style={{
            '--primary': userColor || 'hsl(221.2 83.2% 53.3%)',
          } as React.CSSProperties}
        >
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          Próximos eventos
        </h3>
        
        <div className="flex items-center">
          <IconMorphButton 
            isActive={viewMode === 'calendario'}
            onClick={() => setViewMode(viewMode === 'lista' ? 'calendario' : 'lista')}
            color={userColor || 'hsl(221.2 83.2% 53.3%)'}
          />
        </div>
      </div>

      {/* Vista de lista */}
      {viewMode === 'lista' && (
        <div className="space-y-3">
          {eventosFuturos.length > 0 ? (
            eventosFuturos.map(evento => (
              <div 
                key={evento.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img 
                      src={
                        // Si es una URL completa, usarla directamente
                        (evento.imagen_url?.startsWith('http') || evento.icono_url?.startsWith('http')) 
                          ? (evento.imagen_url || evento.icono_url)
                          // Si es una ruta relativa, construir la URL completa de Supabase
                          : (evento.imagen_url || evento.icono_url)
                            ? `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${evento.imagen_url || evento.icono_url}`
                            // Si no hay imagen, mostrar el marcador de posición
                            : '/images/placeholder-game.svg'
                      }
                      alt={evento.juego_nombre || 'Evento'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Si hay un error al cargar la imagen, mostrar el SVG de marcador de posición
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-game.svg';
                        target.className = 'w-8 h-8 object-contain opacity-50';
                      }}
                      onLoad={(e) => {
                        // Si la imagen se carga correctamente, asegurarse de que tenga el tamaño correcto
                        const target = e.target as HTMLImageElement;
                        if (evento.icono_url) {
                          target.className = 'w-8 h-8 object-contain';
                        } else {
                          target.className = 'w-full h-full object-cover';
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <Badge 
                      className="text-xs mr-2"
                      style={{
                        backgroundColor: `${userColor}20`,
                        color: userColor || 'hsl(221.2 83.2% 53.3%)',
                        borderColor: `${userColor}40`,
                      }}
                    >
                      <span className="flex items-center">
                        {tipoEventoIcon[evento.tipo]}
                        {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                      </span>
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(evento.fecha), 'dd MMM', { locale: es })}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {evento.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {evento.descripcion}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No hay eventos próximos
            </div>
          )}
        </div>
      )}

      {/* Vista de calendario */}
      {viewMode === 'calendario' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h4>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                &lt;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                &gt;
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((dia, i) => (
              <div key={i} className="text-gray-500 dark:text-gray-400">
                {dia}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {diasDelMes.map((dia, i) => {
              const eventosDelDia = getEventosDelDia(dia);
              const esHoy = isSameDay(dia, new Date());
              
              const diaElement = (
                <div 
                  key={i}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-md text-xs relative
                    ${esHoy ? 'font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}
                    ${eventosDelDia.length > 0 ? 'cursor-pointer' : ''}
                  `}
                  style={esHoy ? { 
                    '--primary': userColor || 'hsl(221.2 83.2% 53.3%)',
                    backgroundColor: `${userColor}15`,
                    color: userColor || 'hsl(221.2 83.2% 53.3%)',
                    fontWeight: 600,
                  } as React.CSSProperties : {}}
                >
                  <span>{format(dia, 'd')}</span>
                  {eventosDelDia.length > 0 && (
                    <div className="flex mt-1 space-x-0.5">
                      {eventosDelDia.slice(0, 3).map((evento, idx) => (
                        <div 
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: evento.tipo === 'actualizacion' ? '#3b82f6' : 
                                           evento.tipo === 'parche' ? '#f59e0b' : 
                                           evento.tipo === 'evento' ? '#8b5cf6' : '#10b981'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
              
              return eventosDelDia.length > 0 ? (
                <TooltipProvider key={i}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      {diaElement}
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      align="center"
                      className="p-2 max-w-[200px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md"
                    >
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {format(dia, 'd MMMM', { locale: es })}
                        </p>
                        {eventosDelDia.map((evento) => (
                          <div key={evento.id} className="flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: evento.tipo === 'actualizacion' ? '#3b82f6' : 
                                               evento.tipo === 'parche' ? '#f59e0b' : 
                                               evento.tipo === 'evento' ? '#8b5cf6' : '#10b981'
                              }}
                            />
                            <span className="text-xs truncate">{evento.titulo}</span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : diaElement;
            })}
          </div>
          
          {/* Lista de eventos del día actual */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">
              Eventos de hoy
            </h4>
            <div className="space-y-2">
              {getEventosDelDia(new Date()).length > 0 ? (
                getEventosDelDia(new Date()).map(evento => (
                  <div 
                    key={evento.id}
                    className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  >
                    <Badge 
                      className="text-xs"
                      style={{
                        backgroundColor: `${userColor}20`,
                        color: userColor || 'hsl(221.2 83.2% 53.3%)',
                        borderColor: `${userColor}40`,
                      }}
                    >
                      {tipoEventoIcon[evento.tipo]}
                    </Badge>
                    <span className="text-xs font-medium truncate">
                      {evento.titulo}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                  No hay eventos hoy
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
