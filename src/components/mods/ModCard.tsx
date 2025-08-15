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
  // Usar los campos de la estructura definida en RecursoBase
  const nombre = mod.nombre || '';
  const descripcion = mod.descripcion || '';
  const imagen = mod.url_imagen;
  const version = mod.version_mc || 'Desconocida';
  const autor = mod.autor?.username || 'Desconocido';
  const descargas = (mod as any).descargas || 0;
  const enlacePrincipal = mod.url_descarga;
  const tipoEnlace = mod.tipo;
  
  // Determinar enlaces específicos basados en la fuente
  // Usamos any porque estos campos no están en el tipo Mod pero pueden existir en la implementación
  const tipoEnlaceExterno = (mod as any).tipo_enlace_principal || '';
  const enlaceCurseforge = (mod as any).enlace_curseforge;
  const enlaceModrinth = (mod as any).enlace_modrinth;
  const enlaceGithub = (mod as any).enlace_github;
  const enlaceWebAutor = (mod as any).enlace_web_autor;
  
  // Preparar categorías
  const categorias = (mod as any).categorias || [];
  
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
                {getPlatformIcon(tipoEnlaceExterno)}
                {getPlatformName(tipoEnlaceExterno)}
              </a>
            </Button>
          )}
          
          {/* Botones secundarios */}
          <div className="grid grid-cols-2 gap-2">
            {enlaceCurseforge && tipoEnlaceExterno !== 'curseforge' && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceCurseforge} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <Sword className="h-3 w-3 mr-1" />
                  <span className="truncate">CurseForge</span>
                </a>
              </Button>
            )}
            
            {enlaceModrinth && tipoEnlaceExterno !== 'modrinth' && (
              <Button variant="outline" size="sm" asChild>
                <a href={enlaceModrinth} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <FileText className="h-3 w-3 mr-1" />
                  <span className="truncate">Modrinth</span>
                </a>
              </Button>
            )}
            
            {enlaceGithub && tipoEnlaceExterno !== 'github' && (
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
