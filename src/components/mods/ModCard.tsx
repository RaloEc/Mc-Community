import Link from 'next/link';
import Image from 'next/image';
import { Mod } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, Github, Sword, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModCardProps {
  mod: Mod;
  className?: string;
}

export function ModCard({ mod, className = '' }: ModCardProps) {
  // Usar los campos de la nueva estructura cuando estén disponibles, o los campos de compatibilidad
  const nombre = mod.name || (mod as any).nombre || '';
  const descripcion = mod.summary || mod.description_html || (mod as any).descripcion || '';
  const imagen = mod.logo_url || (mod as any).imagen_url;
  const version = mod.game_versions?.[0] || (mod as any).version || 'Desconocida';
  const autor = mod.author_name || (mod as any).autor || 'Desconocido';
  const descargas = mod.total_downloads || (mod as any).descargas || 0;
  const enlacePrincipal = mod.website_url || (mod as any).enlace_principal;
  const tipoEnlace = mod.source || (mod as any).tipo_enlace_principal;
  
  // Determinar enlaces específicos basados en la fuente
  const enlaceCurseforge = tipoEnlace === 'curseforge' ? enlacePrincipal : (mod as any).enlace_curseforge;
  const enlaceModrinth = tipoEnlace === 'modrinth' ? enlacePrincipal : (mod as any).enlace_modrinth;
  const enlaceGithub = tipoEnlace === 'github' ? enlacePrincipal : (mod as any).enlace_github;
  const enlaceWebAutor = (mod as any).enlace_web_autor;
  
  // Preparar categorías
  const categorias = mod.categories 
    ? mod.categories.map(cat => ({ id: cat, nombre: cat })) 
    : (mod as any).categorias || [];
  
  // Función para obtener el ícono según el tipo de enlace
  const getPlatformIcon = (type: string | undefined) => {
    switch (type) {
      case 'curseforge':
        return <Sword className="h-4 w-4 mr-1" />;
      case 'modrinth':
        return <FileText className="h-4 w-4 mr-1" />;
      case 'github':
        return <Github className="h-4 w-4 mr-1" />;
      default:
        return <ExternalLink className="h-4 w-4 mr-1" />;
    }
  };

  // Función para obtener el nombre de la plataforma
  const getPlatformName = (type: string | undefined) => {
    switch (type) {
      case 'curseforge':
        return 'CurseForge';
      case 'modrinth':
        return 'Modrinth';
      case 'github':
        return 'GitHub';
      default:
        return 'Descargar';
    }
  };

  return (
    <div className={`bg-card rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="relative h-40 bg-muted">
        {imagen ? (
          <Image
            src={imagen}
            alt={nombre}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10">
            <Sword className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {categorias.slice(0, 3).map((categoria) => (
            <Badge key={categoria.id} variant="secondary" className="text-xs">
              {categoria.nombre}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{nombre}</h3>
          <Badge variant="outline" className="whitespace-nowrap">
            v{version}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{descripcion}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center">
            <span>{autor}</span>
          </div>
          <div className="flex items-center">
            <Download className="h-3 w-3 mr-1" />
            <span>{descargas.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="grid gap-2">
          {/* Botón de descarga principal */}
          {enlacePrincipal && (
            <Button asChild className="w-full">
              <a 
                href={enlacePrincipal} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
                onClick={() => {
                  // Aquí podrías añadir un contador de descargas
                  console.log('Descargando desde:', tipoEnlace);
                }}
              >
                {getPlatformIcon(tipoEnlace)}
                {getPlatformName(tipoEnlace)}
              </a>
            </Button>
          )}
          
          {/* Botones secundarios */}
          <div className="grid grid-cols-2 gap-2">
            {enlaceCurseforge && tipoEnlace !== 'curseforge' && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceCurseforge} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <Sword className="h-3 w-3 mr-1" />
                  <span className="truncate">CurseForge</span>
                </a>
              </Button>
            )}
            
            {enlaceModrinth && tipoEnlace !== 'modrinth' && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceModrinth} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <FileText className="h-3 w-3 mr-1" />
                  <span className="truncate">Modrinth</span>
                </a>
              </Button>
            )}
            
            {enlaceGithub && tipoEnlace !== 'github' && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceGithub} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <Github className="h-3 w-3 mr-1" />
                  <span className="truncate">GitHub</span>
                </a>
              </Button>
            )}
            
            {enlaceWebAutor && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceWebAutor} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="truncate">Sitio web</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
