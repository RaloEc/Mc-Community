'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Eye, TrendingUp, Plus, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  fecha_publicacion: string;
  vistas?: number;
  autor: {
    username: string;
    avatar_url?: string;
  };
  categorias: {
    categoria: {
      nombre: string;
      color?: string;
    };
  }[];
}

interface NoticiasDestacadasSectionProps {
  tipo: 'mas-vistas' | 'ultimas' | 'categoria-aleatoria';
  titulo: string;
  icono?: React.ReactNode;
  className?: string;
}

export default function NoticiasDestacadasSection({ 
  tipo, 
  titulo, 
  icono, 
  className = '' 
}: NoticiasDestacadasSectionProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const { user, profile } = useAuth();

  useEffect(() => {
    const loadNoticias = async () => {
      try {
        // Construir baseUrl (cliente)
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

        // Llamar a la API pública que usa service client (evita RLS en cliente)
        const resp = await fetch(`${baseUrl}/api/noticias`, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`);
        const payload = await resp.json();

        const items: any[] = Array.isArray(payload?.data) ? payload.data : [];

        // Ordenar/filtrar en cliente según tipo
        let seleccion = [...items];
        if (tipo === 'mas-vistas') {
          seleccion.sort((a, b) => (Number(b.vistas || 0) - Number(a.vistas || 0)));
        } else if (tipo === 'ultimas') {
          seleccion.sort((a, b) => new Date(b.fecha_publicacion || 0).getTime() - new Date(a.fecha_publicacion || 0).getTime());
        } else if (tipo === 'categoria-aleatoria') {
          // Tomar cualquier categoría presente en datos y filtrar por ella
          const todasCategorias = items.flatMap(n => (n.categorias || []).map((c: any) => c)).filter(Boolean);
          if (todasCategorias.length > 0) {
            const catRandom = todasCategorias[Math.floor(Math.random() * todasCategorias.length)];
            const catId = catRandom.id;
            const catNombre = catRandom.nombre;
            setCategoriaSeleccionada(catNombre || '');
            seleccion = items.filter(n => (n.categorias || []).some((c: any) => c.id === catId));
          }
          // ordenar por fecha desc como fallback
          seleccion.sort((a, b) => new Date(b.fecha_publicacion || 0).getTime() - new Date(a.fecha_publicacion || 0).getTime());
        }

        // Limitar a 4 tarjetas
        seleccion = seleccion.slice(0, 4);

        // Adaptar formato de categorías al esperado por este componente
        const noticiasTransformadas: Noticia[] = seleccion.map((n: any) => ({
          id: n.id,
          titulo: n.titulo,
          contenido: n.contenido,
          imagen_url: n.imagen_url,
          fecha_publicacion: n.fecha_publicacion,
          vistas: n.vistas,
          autor: n.autor || { username: n.autor_nombre || 'Usuario', avatar_url: n.autor_avatar || undefined },
          categorias: (n.categorias || []).map((cat: any) => ({ categoria: { nombre: cat.nombre, color: cat.color } }))
        }));

        setNoticias(noticiasTransformadas);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar noticias:', error);
        setLoading(false);
      }
    };

    loadNoticias();
  }, [tipo]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  if (loading) {
    return (
      <motion.section className={`space-y-6 ${className}`} variants={fadeInUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icono}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {titulo}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Link href="/admin/noticias/crear">
                <Button size="sm" variant="outline" className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Crear Noticia
                </Button>
              </Link>
            )}
            <Link href={user ? "/foro/crear" : "/login?redirect=/foro/crear"}>
              <Button size="sm" variant="outline" className="text-xs">
                <MessageSquarePlus className="h-3.5 w-3.5 mr-1" /> Crear Hilo
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-black rounded-xl h-32"></div>
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section 
      className={`space-y-6 ${className}`}
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icono}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {titulo}
            {categoriaSeleccionada && (
              <span className="text-blue-600 dark:text-blue-500"> - {categoriaSeleccionada}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <Link href="/admin/noticias/crear">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Crear Noticia
              </Button>
            </Link>
          )}
          <Link href={user ? "/foro/crear" : "/login?redirect=/foro/crear"}>
            <Button size="sm" variant="outline" className="text-xs">
              <MessageSquarePlus className="h-3.5 w-3.5 mr-1" /> Crear Hilo
            </Button>
          </Link>
          <Link href="/noticias">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-500">
              Ver más <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {noticias.map((noticia, index) => (
          <motion.div
            key={noticia.id}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <Link href={`/noticias/${noticia.id}`}>
              <Card className="h-full overflow-hidden bg-white/80 backdrop-blur-sm border-gray-200 dark:bg-black/80 dark:data-[theme=amoled]:bg-black dark:border-gray-800 hover:shadow-lg transition-all duration-300 rounded-xl">
                <div className="flex h-28">
                  {noticia.imagen_url && (
                    <div className="relative w-24 flex-shrink-0">
                      <Image
                        src={noticia.imagen_url}
                        alt={noticia.titulo}
                        fill
                        className="object-cover rounded-l-xl"
                      />
                    </div>
                  )}
                  <CardContent className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {noticia.categorias?.slice(0, 1).map((cat, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="text-xs px-2 py-0.5"
                            style={{ 
                              backgroundColor: cat.categoria.color + '20', 
                              color: cat.categoria.color 
                            }}
                          >
                            {cat.categoria.nombre}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {noticia.titulo}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      {tipo === 'mas-vistas' && noticia.vistas && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {noticia.vistas}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
