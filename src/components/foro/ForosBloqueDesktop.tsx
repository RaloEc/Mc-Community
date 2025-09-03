'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import HiloItem, { HiloDTO } from './HiloItem';

// Tipos
type Hilo = {
  id: string;
  titulo: string;
  autor_id: string;
  created_at: string;
  ultimo_post_at: string;
  votos_conteo: number;
  respuestas_conteo: number;
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

interface ForosBloqueDesktopProps {
  limit?: number;
}

export default function ForosBloqueDesktop({ limit = 5 }: ForosBloqueDesktopProps) {
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

  // Formatear fecha relativa
  const formatearFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch (e) {
      return 'fecha desconocida';
    }
  };

  // Cargar hilos para todas las pestañas
  const cargarTodosLosHilos = async () => {
    const tabs: TabKey[] = ['destacados', 'recientes', 'sin_respuestas'];
    
    // Iniciar carga para todas las pestañas
    setLoading({
      destacados: true,
      recientes: true,
      sin_respuestas: true
    });
    
    // Limpiar errores
    setErrors({
      destacados: null,
      recientes: null,
      sin_respuestas: null
    });
    
    // Cargar cada pestaña con un timeout de seguridad
    try {
      // Crear promesas para todas las pestañas
      const promesas = tabs.map(tab => {
        // Promesa con timeout para cada pestaña
        return Promise.race([
          cargarHilos(tab),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Tiempo de espera agotado al cargar ${tab}`));
            }, 8000); // 8 segundos de timeout
          })
        ]);
      });
      
      // Ejecutar todas las promesas en paralelo
      await Promise.allSettled(promesas);
    } catch (error) {
      console.error('Error al cargar los hilos:', error);
      // Los errores individuales ya se manejan en cargarHilos
    }
  };

  // Cargar hilos para una pestaña específica
  const cargarHilos = async (tab: TabKey) => {
    // Si ya tenemos datos para esta pestaña y no estamos cargando, no hacer nada
    if (hilos[tab].length > 0 && !loading[tab]) {
      return;
    }
    
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
        const votos = Array.isArray(hilo.votos_conteo) 
          ? (hilo.votos_conteo[0] ? (hilo.votos_conteo[0] as any).count || 0 : 0) 
          : ((hilo.votos_conteo as any)?.count || 0);
        
        const respuestas = Array.isArray(hilo.respuestas_conteo) 
          ? (hilo.respuestas_conteo[0] ? (hilo.respuestas_conteo[0] as any).count || 0 : 0) 
          : ((hilo.respuestas_conteo as any)?.count || 0);
        
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

  // Cargar datos al montar el componente
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const cargarDatos = async () => {
      try {
        // Establecer un timeout global para toda la carga
        const timeoutPromise = new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Tiempo de espera global agotado al cargar los foros'));
          }, 10000); // 10 segundos de timeout global
        });
        
        // Intentar cargar los datos con un tiempo límite global
        await Promise.race([
          cargarTodosLosHilos(),
          timeoutPromise
        ]);
        
        // Limpiar el timeout ya que la carga se completó
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error global en ForosBloqueDesktop:', err);
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setErrors({
            destacados: 'Error al cargar los foros',
            recientes: 'Error al cargar los foros',
            sin_respuestas: 'Error al cargar los foros'
          });
          setLoading({
            destacados: false,
            recientes: false,
            sin_respuestas: false
          });
        }
      }
    };
    
    cargarDatos();
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [limit]);

  // Convertir el tipo Hilo al tipo HiloDTO para usar con HiloItem
  const convertirAHiloDTO = (hilo: Hilo): HiloDTO => {
    // Extraer el valor numérico de votos_conteo
    let votos = 0;
    if (hilo.votos_conteo !== null) {
      if (Array.isArray(hilo.votos_conteo) && hilo.votos_conteo.length > 0 && hilo.votos_conteo[0]) {
        votos = (hilo.votos_conteo[0] as any).count ?? 0;
      } else if (typeof hilo.votos_conteo === 'object' && 'count' in hilo.votos_conteo) {
        votos = (hilo.votos_conteo as any).count ?? 0;
      } else if (typeof hilo.votos_conteo === 'number') {
        votos = hilo.votos_conteo;
      }
    }
    
    // Extraer el valor numérico de respuestas_conteo
    let respuestas = 0;
    if (hilo.respuestas_conteo !== null) {
      if (Array.isArray(hilo.respuestas_conteo) && hilo.respuestas_conteo.length > 0 && hilo.respuestas_conteo[0]) {
        respuestas = (hilo.respuestas_conteo[0] as any).count ?? 0;
      } else if (typeof hilo.respuestas_conteo === 'object' && 'count' in hilo.respuestas_conteo) {
        respuestas = (hilo.respuestas_conteo as any).count ?? 0;
      } else if (typeof hilo.respuestas_conteo === 'number') {
        respuestas = hilo.respuestas_conteo;
      }
    }
    
    return {
      id: hilo.id,
      titulo: hilo.titulo,
      created_at: hilo.created_at,
      ultima_respuesta_at: hilo.ultimo_post_at,
      respuestas_count: respuestas,
      vistas: 0, // No tenemos este dato en el tipo Hilo
      votos: votos,
      subcategoria: hilo.foro_categorias ? {
        id: '', // No tenemos este dato en el tipo Hilo
        nombre: hilo.foro_categorias.nombre,
        slug: null,
        color: hilo.foro_categorias.color
      } : null,
      autor: hilo.perfiles ? {
        id: hilo.autor_id,
        username: hilo.perfiles.username,
        avatar_url: hilo.perfiles.avatar_url
      } : null
    };
  };
  
  // Renderizar un hilo usando el componente HiloItem
  const renderHilo = (hilo: Hilo) => (
    <div key={hilo.id} className="mb-3">
      <HiloItem hilo={convertirAHiloDTO(hilo)} />
    </div>
  );

  // Renderizar contenido de una columna
  const renderColumnContent = (tab: TabKey, title: string) => {
    if (loading[tab]) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (errors[tab]) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>{errors[tab]}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => cargarHilos(tab)}
          >
            Intentar de nuevo
          </Button>
        </div>
      );
    }

    if (hilos[tab].length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p>No hay hilos disponibles.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {hilos[tab].map(renderHilo)}
      </div>
    );
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Foros</h2>
        <div className="flex gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/foro/crear-hilo">Crear nuevo hilo</Link>
          </Button>
          <Link 
            href="/foro" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todos <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          {renderColumnContent('destacados', 'Hilos Destacados')}
        </div>
        <div className="col-span-1">
          {renderColumnContent('recientes', 'Hilos Recientes')}
        </div>
        <div className="col-span-1">
          {renderColumnContent('sin_respuestas', 'Sin Respuestas')}
        </div>
      </div>
    </section>
  );
}
