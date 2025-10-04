/**
 * Componente de búsqueda avanzada para el foro
 * Permite buscar hilos y comentarios con filtros
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBuscarContenidoForo } from './hooks/useModeracionForo';
import { Search, ExternalLink, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';

export default function BusquedaAvanzada() {
  const [termino, setTermino] = useState('');
  const terminoDebounced = useDebounce(termino, 500);
  const { data: resultados, isLoading, isFetching } = useBuscarContenidoForo(
    terminoDebounced,
    terminoDebounced.length >= 3
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Búsqueda Avanzada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en hilos y comentarios... (mínimo 3 caracteres)"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            className="pl-10"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {terminoDebounced.length > 0 && terminoDebounced.length < 3 && (
          <p className="text-sm text-muted-foreground">
            Escribe al menos 3 caracteres para buscar
          </p>
        )}

        {terminoDebounced.length >= 3 && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4 mt-2" />
                  </div>
                ))}
              </div>
            ) : resultados && resultados.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {resultados.map((resultado) => (
                  <div
                    key={`${resultado.tipo}-${resultado.id}`}
                    className="p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={resultado.tipo === 'hilo' ? 'default' : 'secondary'}>
                            {resultado.tipo === 'hilo' ? (
                              <>
                                <FileText className="h-3 w-3 mr-1" />
                                Hilo
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Comentario
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            por {resultado.autor_username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(resultado.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{resultado.titulo}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {resultado.contenido}
                        </p>
                      </div>
                      <Link href={resultado.url_relativa} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron resultados para "{terminoDebounced}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
