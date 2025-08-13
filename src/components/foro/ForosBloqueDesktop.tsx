'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
    
    // Cargar cada pestaña
    for (const tab of tabs) {
      await cargarHilos(tab);
    }
  };

  // Cargar hilos para una pestaña específica
  const cargarHilos = async (tab: TabKey) => {
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
        foro_categorias(nombre, color)
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
    cargarTodosLosHilos();
  }, [limit]);

  // Renderizar un hilo
  const renderHilo = (hilo: Hilo) => (
    <Link 
      href={`/foro/hilo/${hilo.id}`} 
      key={hilo.id}
      className="block p-3 rounded-lg transition-all hover:bg-accent/50 border border-border/50"
    >
      <div className="flex justify-between items-start">
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
          <span className="text-xs">{hilo.respuestas_conteo}</span>
        </div>
      </div>
    </Link>
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
      <div className="space-y-2">
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
