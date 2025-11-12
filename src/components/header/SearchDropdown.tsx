'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Newspaper, MessageCircle, Users } from 'lucide-react';

interface Usuario {
  id: string;
  username: string;
  avatar_url?: string;
  public_id?: string;
  color?: string;
  rol?: string;
  bio?: string;
  tipo: 'usuario';
}

interface Noticia {
  id: string;
  titulo: string;
  imagen_url?: string;
  tipo: 'noticia';
}

interface Hilo {
  id: string;
  titulo: string;
  tipo: 'hilo';
}

type Resultado = Usuario | Noticia | Hilo;

interface SearchDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  profileColor?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  isOpen,
  onClose,
  profileColor,
}) => {
  const [results, setResults] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const isUserSearch = query.startsWith('@');
      const searchQuery = isUserSearch ? query.substring(1) : query;

      if (isUserSearch) {
        // Solo buscar usuarios cuando comienza con @
        const usuariosRes = await fetch(
          `/api/usuarios/buscar?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const usuariosData = usuariosRes.ok ? await usuariosRes.json() : { usuarios: [] };

        const usuarios = (usuariosData.usuarios || []).map((u: any) => ({
          ...u,
          tipo: 'usuario' as const,
        }));

        setResults(usuarios);
      } else {
        // Buscar noticias e hilos cuando NO comienza con @
        const [noticiasRes, hilosRes] = await Promise.all([
          fetch(`/api/noticias?busqueda=${encodeURIComponent(searchQuery)}&limit=3`),
          fetch(`/api/foro/hilos?buscar=${encodeURIComponent(searchQuery)}&limit=3`),
        ]);

        const noticiasData = noticiasRes.ok ? await noticiasRes.json() : { data: [] };
        const hilosData = hilosRes.ok ? await hilosRes.json() : { items: [] };

        const noticias = (noticiasData.data || []).map((n: any) => ({
          id: n.id,
          titulo: n.titulo,
          imagen_url: n.imagen_url,
          tipo: 'noticia' as const,
        }));

        const hilos = (hilosData.items || []).map((h: any) => ({
          id: h.id,
          titulo: h.titulo,
          tipo: 'hilo' as const,
        }));

        setResults([...noticias, ...hilos]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !query.trim() || query.length < 2) {
    return null;
  }

  const renderResultItem = (resultado: Resultado) => {
    if (resultado.tipo === 'usuario') {
      const usuario = resultado as Usuario;
      return (
        <Link
          key={`${usuario.tipo}-${usuario.id}`}
          href={`/perfil/${encodeURIComponent(usuario.public_id || usuario.username || '')}`}
          onClick={onClose}
        >
          <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors cursor-pointer">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900">
              {usuario.avatar_url ? (
                <img
                  src={usuario.avatar_url}
                  alt={usuario.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold truncate text-sm"
                style={{ color: usuario.color || profileColor || '#3b82f6' }}
              >
                {usuario.username}
              </h4>
              {usuario.bio && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {usuario.bio}
                </p>
              )}
            </div>
            {usuario.rol && usuario.rol !== 'user' && (
              <Badge className="flex-shrink-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                {usuario.rol === 'admin' ? '👑' : '🛡️'}
              </Badge>
            )}
          </div>
        </Link>
      );
    } else if (resultado.tipo === 'noticia') {
      const noticia = resultado as Noticia;
      return (
        <Link
          key={`${noticia.tipo}-${noticia.id}`}
          href={`/noticias/${noticia.id}`}
          onClick={onClose}
        >
          <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors cursor-pointer">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-900">
              {noticia.imagen_url ? (
                <img
                  src={noticia.imagen_url}
                  alt={noticia.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Newspaper className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate text-sm text-gray-900 dark:text-white">
                {noticia.titulo}
              </h4>
              <p className="text-xs text-orange-600 dark:text-orange-400">Noticia</p>
            </div>
          </div>
        </Link>
      );
    } else {
      const hilo = resultado as Hilo;
      return (
        <Link
          key={`${hilo.tipo}-${hilo.id}`}
          href={`/foro/hilos/${hilo.id}`}
          onClick={onClose}
        >
          <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors cursor-pointer">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <MessageCircle className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate text-sm text-gray-900 dark:text-white">
                {hilo.titulo}
              </h4>
              <p className="text-xs text-purple-600 dark:text-purple-400">Hilo</p>
            </div>
          </div>
        </Link>
      );
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="inline-block animate-spin">⏳</div> Buscando...
        </div>
      ) : results.length > 0 ? (
        <div className="p-2">
          {results.map((resultado) => renderResultItem(resultado))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
};
