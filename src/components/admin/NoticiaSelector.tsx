'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Noticia {
  id: string;
  titulo: string;
  slug?: string; // Hacer slug opcional
  created_at: string;
  [key: string]: any; // Permitir propiedades adicionales
}

interface NoticiaSelectorProps {
  onSelect: (noticia: Noticia) => void;
  disabled?: boolean;
}

export function NoticiaSelector({ onSelect, disabled = false }: NoticiaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchNoticias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Consulta directa a la tabla noticias con solo los campos necesarios
      let query = supabase
        .from('noticias')
        .select('id, titulo, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Asegurarnos de que los datos tengan el formato esperado
      const noticiasFormateadas = (data || []).map((noticia: any) => ({
        id: noticia.id.toString(),
        titulo: noticia.titulo || 'Sin título',
        created_at: noticia.created_at || new Date().toISOString(),
        // slug es opcional, así que solo lo incluimos si existe
        ...(noticia.slug && { slug: noticia.slug })
      }));
      
      setNoticias(noticiasFormateadas);
    } catch (err) {
      console.error('Error al cargar noticias:', err);
      setError('Error al cargar las noticias. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNoticias();
    }
  }, [open, searchTerm]);

  const handleSelect = (noticia: Noticia) => {
    onSelect(noticia);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Buscar noticia...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar noticias..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="h-[300px] w-full">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : noticias.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No se encontraron noticias
            </div>
          ) : (
            <div className="divide-y">
              {noticias.map((noticia) => (
                <div 
                  key={noticia.id} 
                  className="group relative p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      onSelect(noticia);
                      setOpen(false);
                    }}
                  >
                    <h4 className="font-medium text-sm line-clamp-1">{noticia.titulo}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(noticia.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Link 
                    href={`/noticias/${noticia.slug || noticia.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    title="Ver noticia"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
