'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Check, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';

// Tipos para los resultados de Modrinth
interface ModrinthMod {
  id: number;
  source: string;
  source_id: string;
  name: string;
  slug?: string;
  summary?: string;
  logo_url?: string;
  total_downloads?: number;
  author_name?: string;
  categories?: string[];
  game_versions?: string[];
  mod_loader?: string[];
}

// Interfaz para las versiones de Minecraft
interface GameVersion {
  name: string;
  version_type: string;
  version_number: string;
  date: string;
}

export default function ModrinthSyncPage() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [results, setResults] = useState<ModrinthMod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Cargar versiones de Minecraft al montar el componente
  useEffect(() => {
    const loadGameVersions = async () => {
      try {
        setLoadingVersions(true);
        const response = await fetch('/api/modrinth/versions');
        
        if (!response.ok) {
          console.error('Error al cargar versiones de Minecraft');
          return;
        }
        
        const data = await response.json();
        
        // Filtrar solo versiones estables y ordenar por fecha
        const stableVersions = data
          .filter((version: GameVersion) => 
            version.version_type === 'release' && 
            !version.version_number.includes('w') && 
            !version.version_number.includes('pre')
          )
          .sort((a: GameVersion, b: GameVersion) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        
        setGameVersions(stableVersions);
        
        // Seleccionar la versión más reciente por defecto
        if (stableVersions.length > 0) {
          setSelectedVersion(stableVersions[0].version_number);
        }
      } catch (error) {
        console.error('Error al cargar versiones de Minecraft:', error);
      } finally {
        setLoadingVersions(false);
      }
    };
    
    loadGameVersions();
  }, []);

  // Función para buscar mods en Modrinth
  const searchMods = async () => {
    if (!query.trim() && !selectedVersion) {
      setError('Por favor, introduce un término de búsqueda o selecciona una versión');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSyncStatus({});

      // Construir URL con parámetros
      let url = `/api/sync/modrinth?limit=${limit}`;
      
      if (query.trim()) {
        url += `&query=${encodeURIComponent(query)}`;
      }
      
      if (selectedVersion) {
        url += `&gameVersion=${encodeURIComponent(selectedVersion)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al sincronizar mods');
      }
      
      const data = await response.json();
      setResults(data);
      
      // Marcar todos los mods como sincronizados exitosamente
      const newSyncStatus: Record<string, 'pending' | 'success' | 'error'> = {};
      data.forEach((mod: ModrinthMod) => {
        newSyncStatus[mod.source_id] = 'success';
      });
      setSyncStatus(newSyncStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para sincronizar un mod específico
  const syncMod = async (id: string) => {
    try {
      setSyncStatus(prev => ({ ...prev, [id]: 'pending' }));
      
      const response = await fetch(`/api/sync/modrinth?id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al sincronizar mod');
      }
      
      const data = await response.json();
      
      // Actualizar el resultado en la lista
      setResults(prev => 
        prev.map(mod => 
          mod.source_id === id ? data : mod
        )
      );
      
      setSyncStatus(prev => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, [id]: 'error' }));
      console.error('Error al sincronizar mod:', err);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronizar Mods de Modrinth</h1>
          <p className="text-muted-foreground mt-2">
            Busca y sincroniza mods desde Modrinth a tu base de datos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda de Mods</CardTitle>
            <CardDescription>
              Introduce un término de búsqueda para encontrar mods en Modrinth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Término de búsqueda</label>
                    <Input
                      placeholder="Buscar mods..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchMods()}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-sm font-medium mb-1 block">Versión de Minecraft</label>
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una versión" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingVersions ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Cargando versiones...</span>
                          </div>
                        ) : (
                          gameVersions.map((version) => (
                            <SelectItem key={version.version_number} value={version.version_number}>
                              {version.version_number}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-sm font-medium mb-1 block">Límite</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={searchMods} disabled={loading} className="w-full md:w-auto">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      'Buscar y Sincronizar Mods'
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resultados ({results.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((mod) => (
                <Card key={mod.source_id} className="overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {mod.logo_url ? (
                      <Image
                        src={mod.logo_url}
                        alt={mod.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Download className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">{mod.name}</CardTitle>
                      {syncStatus[mod.source_id] === 'success' && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Sincronizado
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {mod.summary || 'Sin descripción'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Autor:</span>{' '}
                      <span className="text-sm text-muted-foreground">{mod.author_name || 'Desconocido'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Descargas:</span>{' '}
                      <span className="text-sm text-muted-foreground">{mod.total_downloads?.toLocaleString() || 0}</span>
                    </div>
                    {mod.game_versions && mod.game_versions.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Versiones:</span>{' '}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mod.game_versions.slice(0, 3).map((version) => (
                            <Badge key={version} variant="secondary" className="text-xs">
                              {version}
                            </Badge>
                          ))}
                          {mod.game_versions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{mod.game_versions.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {mod.categories && mod.categories.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Categorías:</span>{' '}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mod.categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {mod.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{mod.categories.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex justify-between p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`https://modrinth.com/mod/${mod.slug || mod.source_id}`} target="_blank" rel="noopener noreferrer">
                        Ver en Modrinth
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => syncMod(mod.source_id)}
                      disabled={syncStatus[mod.source_id] === 'pending'}
                    >
                      {syncStatus[mod.source_id] === 'pending' ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Sincronizando...
                        </>
                      ) : syncStatus[mod.source_id] === 'success' ? (
                        <>
                          <Check className="mr-2 h-3 w-3" />
                          Sincronizado
                        </>
                      ) : (
                        'Sincronizar'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
