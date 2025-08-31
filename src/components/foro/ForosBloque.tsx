'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getUserInitials } from '@/lib/utils/avatar-utils';
import ForosBloqueDesktop from './ForosBloqueDesktop';

// Tipos
type ConteoItem = {
  count: number;
};

type Hilo = {
  id: string;
  titulo: string;
  autor_id: string;
  created_at: string;
  ultimo_post_at: string;
  votos_conteo: number | ConteoItem | ConteoItem[];
  respuestas_conteo: number | ConteoItem | ConteoItem[];
  perfiles: {
    username: string;
    rol: string;
    avatar_url: string | null;
  } | null;
  foro_categorias: {
    nombre: string;
    color?: string | null;
  } | null;
};

type TabKey = 'destacados' | 'recientes' | 'sin_respuestas';

interface ForosBloqueProps {
  limit?: number;
}

export default function ForosBloque({ limit = 5 }: ForosBloqueProps) {
  // Declarar todos los estados al principio del componente
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('destacados');
  const [hilos, setHilos] = useState<Record<TabKey, Hilo[]>>({
    destacados: [],
    recientes: [],
    sin_respuestas: []
  });
  const [loading, setLoading] = useState<Record<TabKey, boolean>>({
    destacados: true,
    recientes: true,
    sin_respuestas: true
  });
  const [errors, setErrors] = useState<Record<TabKey, string | null>>({
    destacados: null,
    recientes: null,
    sin_respuestas: null
  });

  // Detectar tamaño de pantalla
  useEffect(() => {
    setMounted(true);
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // 1024px es el breakpoint para lg en Tailwind
    };
    
    // Comprobar al cargar
    checkIfDesktop();
    
    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkIfDesktop);
    
    // Limpiar evento
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  // Formatear fecha relativa
  const formatearFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch (e) {
      return 'fecha desconocida';
    }
  };

  // Cargar hilos según la pestaña activa
  const cargarHilos = async (tab: TabKey) => {
    // Si ya tenemos datos y no estamos cargando, no hacer nada
    if (hilos[tab].length > 0 && !loading[tab]) return;
    
    // Iniciar carga
    setLoading(prev => ({ ...prev, [tab]: true }));
    // Limpiar error específico de esta pestaña
    setErrors(prev => ({ ...prev, [tab]: null }));
    
    const supabase = createClient();
    
    try {
      // Base select para hilos
      const baseSelect = `
        id, 
        titulo, 
        autor_id,
        created_at,
        ultimo_post_at,
        votos_conteo:foro_votos_hilos(count),
        respuestas_conteo:foro_posts(count),
        perfiles:autor_id(username, rol:role, avatar_url),
        foro_categorias:categoria_id(nombre, color)
      `;

      let query = supabase.from('foro_hilos').select(baseSelect);

      // Configurar la consulta según la pestaña
      switch (tab) {
        case 'destacados':
          // Hilos con más votos y respuestas
          query = query.order('votos_conteo', { ascending: false });
          break;
        case 'recientes':
          // Hilos más recientes
          query = query.order('created_at', { ascending: false });
          break;
        case 'sin_respuestas':
          // Hilos sin respuestas - No podemos filtrar directamente por respuestas_conteo
          // porque es un alias, así que traemos todos y filtramos en el cliente
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Limitar resultados - para sin_respuestas traemos más para poder filtrar
      const limit_query = tab === 'sin_respuestas' ? limit * 3 : limit;
      const { data, error: queryError } = await query.limit(limit_query);

      if (queryError) throw new Error(queryError.message);

      // Normalizar los conteos (convertir de objetos a números)
      const hilosNormalizados = data?.map(hilo => {
        let votos = 0;
        if (Array.isArray(hilo.votos_conteo) && hilo.votos_conteo.length > 0 && hilo.votos_conteo[0]) {
          votos = (hilo.votos_conteo[0] as any).count ?? 0;
        } else if (typeof hilo.votos_conteo === 'object' && hilo.votos_conteo !== null && 'count' in hilo.votos_conteo) {
          votos = (hilo.votos_conteo as any).count ?? 0;
        } else if (typeof hilo.votos_conteo === 'number') {
          votos = hilo.votos_conteo;
        }
        
        let respuestas = 0;
        if (Array.isArray(hilo.respuestas_conteo) && hilo.respuestas_conteo.length > 0 && hilo.respuestas_conteo[0]) {
          respuestas = (hilo.respuestas_conteo[0] as any).count ?? 0;
        } else if (typeof hilo.respuestas_conteo === 'object' && hilo.respuestas_conteo !== null && 'count' in hilo.respuestas_conteo) {
          respuestas = (hilo.respuestas_conteo as any).count ?? 0;
        } else if (typeof hilo.respuestas_conteo === 'number') {
          respuestas = hilo.respuestas_conteo;
        }
        
        return { 
          ...hilo, 
          votos_conteo: votos, 
          respuestas_conteo: respuestas 
        };
      }) || [];

      // Para la pestaña sin_respuestas, filtramos en el cliente
      let hilosFiltrados = hilosNormalizados;
      if (tab === 'sin_respuestas') {
        hilosFiltrados = hilosNormalizados.filter(hilo => hilo.respuestas_conteo === 0).slice(0, limit);
      }

      // Actualizar estado
      setHilos(prev => ({ ...prev, [tab]: hilosFiltrados }));
    } catch (err) {
      console.error(`Error al cargar hilos (${tab}):`, err);
      setErrors(prev => ({ ...prev, [tab]: `No se pudieron cargar los hilos de ${tab}` }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  // Cargar datos de la pestaña activa cuando cambia (solo en móvil)
  useEffect(() => {
    if (!isDesktop) {
      let isMounted = true;
      let timeoutId: NodeJS.Timeout;
      
      const cargarDatosConTimeout = async () => {
        try {
          // Establecer un timeout para la carga
          const timeoutPromise = new Promise<void>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Tiempo de espera agotado al cargar ${activeTab}`));
            }, 8000); // 8 segundos de timeout
          });
          
          // Intentar cargar los datos con un tiempo límite
          await Promise.race([
            cargarHilos(activeTab),
            timeoutPromise
          ]);
          
          // Limpiar el timeout ya que la carga se completó
          clearTimeout(timeoutId);
        } catch (err) {
          console.error(`Error en ForosBloque al cargar ${activeTab}:`, err);
          // Solo actualizar el estado si el componente sigue montado
          if (isMounted) {
            setErrors(prev => ({ ...prev, [activeTab]: `Error al cargar los hilos de ${activeTab}` }));
            setLoading(prev => ({ ...prev, [activeTab]: false }));
          }
        }
      };
      
      cargarDatosConTimeout();
      
      // Limpiar al desmontar o cambiar de pestaña
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
  }, [activeTab, isDesktop]);

  // Renderizar un hilo
  const renderHilo = (hilo: Hilo) => (
    <Link 
      href={`/foro/hilo/${hilo.id}`} 
      key={hilo.id}
      className="block p-4 rounded-lg transition-all hover:bg-accent/50 border border-border/50 mb-2"
    >
      <div className="flex justify-between items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={hilo.perfiles?.avatar_url || undefined} alt={hilo.perfiles?.username || 'Usuario'} />
          <AvatarFallback>
            {getUserInitials(hilo.perfiles?.username || 'Usuario')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-foreground line-clamp-1">{hilo.titulo}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>Por {hilo.perfiles?.username || 'Usuario'}</span>
            <span>•</span>
            <span>{formatearFecha(hilo.ultimo_post_at || hilo.created_at)}</span>
            {hilo.foro_categorias && (
              <>
                <span>•</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs" 
                  style={{ 
                    backgroundColor: hilo.foro_categorias.color || '#4f46e5',
                    color: 'white'
                  }}
                >
                  {hilo.foro_categorias.nombre}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{typeof hilo.respuestas_conteo === 'number' ? hilo.respuestas_conteo : 0}</span>
        </div>
      </div>
    </Link>
  );

  // Renderizar contenido de pestaña
  const renderTabContent = (tab: TabKey) => {
    if (loading[tab]) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (errors[tab]) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>{errors[tab]}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => cargarHilos(tab)}
          >
            Intentar de nuevo
          </Button>
        </div>
      );
    }

    if (hilos[tab].length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay hilos disponibles en esta categoría.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {hilos[tab].map(renderHilo)}
      </div>
    );
  };

  // Evitar render hasta que el componente esté montado en cliente (previene hydration issues)
  if (!mounted) {
    return (
      <section>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  // Si es escritorio, usar el componente optimizado para escritorio
  if (isDesktop) {
    return <ForosBloqueDesktop limit={limit} />;
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Foros</h2>
        <Link 
          href="/foro" 
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <Tabs defaultValue="destacados" onValueChange={(value) => setActiveTab(value as TabKey)}>
        <TabsList className="mb-4">
          <TabsTrigger value="destacados">Destacados</TabsTrigger>
          <TabsTrigger value="recientes">Recientes</TabsTrigger>
          <TabsTrigger value="sin_respuestas">Sin Respuestas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="destacados" className="mt-0">
          {renderTabContent('destacados')}
        </TabsContent>
        
        <TabsContent value="recientes" className="mt-0">
          {renderTabContent('recientes')}
        </TabsContent>
        
        <TabsContent value="sin_respuestas" className="mt-0">
          {renderTabContent('sin_respuestas')}
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/foro/crear-hilo">Crear nuevo hilo</Link>
        </Button>
      </div>
    </section>
  );
}
