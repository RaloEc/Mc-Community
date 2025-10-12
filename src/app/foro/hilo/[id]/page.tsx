'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/lib/database.types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AdBanner from '@/components/ads/AdBanner';
import ComentariosNuevo from '@/components/ComentariosNuevo';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { 
  Eye, 
  MessageSquare, 
  Heart, 
  ShieldCheck 
} from 'lucide-react';

// --- TIPOS LOCALES ---

type HiloRow = Database['public']['Tables']['foro_hilos']['Row'];
type PostRow = Database['public']['Tables']['foro_posts']['Row'];
type CategoriaRow = Database['public']['Tables']['foro_categorias']['Row'];
type PerfilRow = Database['public']['Tables']['perfiles']['Row'];

// Tipos para los datos enriquecidos de la API
interface HiloConDetalles extends HiloRow {
  autor: PerfilRow;
  categoria: CategoriaRow;
}

interface PostConAutor extends PostRow {
  autor: PerfilRow;
}

// --- SUBCOMPONENTES ---

function HiloHeader({ hilo, numRespuestas }: { hilo: HiloConDetalles; numRespuestas: number }) {
  return (
    <header>
      <div className="flex items-center gap-2 mb-2">
        {hilo.es_importante && <Badge variant="default">Destacado</Badge>}
        {hilo.estado === 'cerrado' && <Badge variant="destructive">Cerrado</Badge>}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{hilo.titulo}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={hilo.autor.avatar_url ?? undefined} alt={hilo.autor.username ?? ''} />
            <AvatarFallback>{hilo.autor.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{hilo.autor.username}</span>
        </div>
        <span>Publicado {new Date(hilo.creado_en).toLocaleDateString()}</span>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{hilo.vistas}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{numRespuestas}</span>
        </div>
      </div>
    </header>
  );
}

function PostItem({ post, isInitial = false }: { post: PostConAutor | HiloConDetalles; isInitial?: boolean }) {
  const fecha = 'creado_en' in post ? new Date(post.creado_en).toLocaleString() : '';
  return (
    <div className={`flex gap-4 ${isInitial ? 'bg-card/50 p-4 rounded-lg' : ''}`}>
      {!isInitial && (
        <Avatar className="hidden sm:block mt-1">
          <AvatarImage src={post.autor.avatar_url ?? undefined} alt={post.autor.username ?? ''} />
          <AvatarFallback>{post.autor.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {'es_respuesta' in post && post.es_respuesta && (
              <Badge variant="success" className="mr-2">
                <ShieldCheck className="h-3 w-3 mr-1" /> Respuesta
              </Badge>
            )}
          </div>
          {fecha && <span className="text-xs text-muted-foreground">{fecha}</span>}
        </div>
        <div
          className="prose prose-sm max-w-none dark:prose-invert amoled:prose-invert amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)] amoled:[--tw-prose-quotes:theme(colors.white)] amoled:[--tw-prose-bullets:theme(colors.slate.300)] amoled:[--tw-prose-links:theme(colors.sky.400)]"
          dangerouslySetInnerHTML={{ __html: post.contenido }}
        />
      </div>
    </div>
  );
}



// --- COMPONENTE PRINCIPAL ---

export default function HiloPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Log para depurar el valor del ID
  console.log('ID del hilo:', id, 'Tipo:', typeof id);

  const [hilo, setHilo] = useState<HiloConDetalles | null>(null);
  const [posts, setPosts] = useState<PostConAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const [hiloRes, postsRes] = await Promise.all([
          fetch(`/api/foro/hilo/${id}`),
          fetch(`/api/foro/hilo/${id}/posts`)
        ]);

        if (!hiloRes.ok) {
          if (hiloRes.status === 404) return notFound();
          throw new Error('No se pudo cargar el hilo.');
        }

        if (!postsRes.ok) {
          throw new Error('No se pudieron cargar las respuestas.');
        }

        const hiloData: HiloConDetalles = await hiloRes.json();
        const postsResponse = await postsRes.json();

        setHilo(hiloData);
        // El endpoint devuelve { data: [...], total: ... }
        setPosts(postsResponse.data || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [id]);



  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Cargando hilo...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!hilo) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/foro">Foro</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/foro/categoria/${hilo.categoria.slug}`}>{hilo.categoria.nombre}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{hilo.titulo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <HiloHeader hilo={hilo} numRespuestas={posts.length} />

      <Separator className="my-8" />

      <div className="space-y-8">
        <PostItem post={hilo} isInitial={true} />
      </div>
      
      {hilo.estado !== 'cerrado' ? (
        <ComentariosNuevo contentType="hilo" contentId={id.toString()} />
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 text-center mt-8">
          <p>Este hilo está cerrado y no acepta nuevas respuestas.</p>
        </div>
      )}

      <div className="mt-8">
        <AdBanner />
      </div>
    </div>
  );
}
