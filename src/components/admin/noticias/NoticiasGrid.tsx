'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Virtualización deshabilitada por compatibilidad de dependencias
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  X,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NoticiaCard, NoticiaCardSkeleton } from './NoticiaCard';
import { 
  useNoticiasDashboard, 
  useFiltrarNoticias,
  usePerformanceMetrics,
  type NoticiaReciente 
} from '../hooks/useNoticiasDashboard';

// =====================================================
// Tipos
// =====================================================

interface NoticiasGridProps {
  variant?: 'recientes' | 'mas-vistas';
  enableVirtualization?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  limite?: number;
  columnCount?: number;
}

// =====================================================
// Componente de Barra de Búsqueda
// =====================================================

const SearchBar = memo(function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar noticias..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

// =====================================================
// Componente de Filtros
// =====================================================

const FilterBar = memo(function FilterBar({
  estado,
  onEstadoChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: {
  estado: string;
  onEstadoChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={estado} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-[150px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="publicada">Publicada</SelectItem>
          <SelectItem value="borrador">Borrador</SelectItem>
          <SelectItem value="programada">Programada</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fecha">Fecha</SelectItem>
          <SelectItem value="vistas">Vistas</SelectItem>
          <SelectItem value="titulo">Título</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onSortOrderChange}
        className="px-3"
      >
        {sortOrder === 'asc' ? (
          <SortAsc className="h-4 w-4" />
        ) : (
          <SortDesc className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

// VirtualizedGrid eliminado temporalmente (dependencias no disponibles)

// =====================================================
// Componente de Grid Normal (sin virtualización)
// =====================================================

const NormalGrid = memo(function NormalGrid({
  noticias,
  variant,
  onNoticiaHover,
}: {
  noticias: NoticiaReciente[];
  variant: 'recientes' | 'mas-vistas';
  onNoticiaHover: (id: string) => void;
}) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {noticias.map((noticia) => (
          <NoticiaCard
            key={noticia.id}
            noticia={noticia}
            variant={variant === 'mas-vistas' ? 'mas-vista' : 'reciente'}
            showImage={true}
            onHover={onNoticiaHover}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

// =====================================================
// Componente Principal
// =====================================================

export const NoticiasGrid = memo(function NoticiasGrid({
  variant = 'recientes',
  enableVirtualization = false,
  enableSearch = true,
  enableFilters = true,
  limite = 20,
  columnCount = 4,
}: NoticiasGridProps) {
  // Métricas de rendimiento
  usePerformanceMetrics('NoticiasGrid');

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState('todos');
  const [sortBy, setSortBy] = useState<'fecha' | 'vistas' | 'titulo'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Obtener datos
  const { 
    recientes, 
    masVistas, 
    isLoading, 
    isError,
    prefetchNoticia,
    isRealTimeActive,
  } = useNoticiasDashboard({
    limiteRecientes: variant === 'recientes' ? limite : 5,
    limiteVistas: variant === 'mas-vistas' ? limite : 5,
    enableRealtime: true,
  });

  // Seleccionar noticias según variante
  const noticiasBase = variant === 'recientes' ? recientes : masVistas;

  // Aplicar filtros
  const noticiasFiltradas = useFiltrarNoticias({
    noticias: noticiasBase,
    searchTerm: enableSearch ? searchTerm : '',
    estado: enableFilters && estado !== 'todos' ? estado : undefined,
    sortBy: enableFilters ? sortBy : 'fecha',
    sortOrder: enableFilters ? sortOrder : 'desc',
  });

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'search', {
        search_term: value,
        event_category: 'Dashboard',
      });
    }
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleNoticiaHover = useCallback((id: string) => {
    // Prefetch de la noticia al hacer hover
    prefetchNoticia(id);
  }, [prefetchNoticia]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Calcular estadísticas
  const stats = useMemo(() => ({
    total: noticiasBase.length,
    filtradas: noticiasFiltradas.length,
    vistasTotal: noticiasBase.reduce((sum, n) => sum + n.vistas, 0),
  }), [noticiasBase, noticiasFiltradas]);

  // Renderizado condicional
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-muted-foreground mb-4">
          Error al cargar las noticias
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {variant === 'recientes' ? 'Noticias Recientes' : 'Noticias Más Vistas'}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{stats.filtradas} de {stats.total} noticias</span>
              <span>•</span>
              <span>{stats.vistasTotal.toLocaleString()} vistas totales</span>
              {isRealTimeActive && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    En vivo
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        {enableSearch && (
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
          />
        )}

        {/* Filtros */}
        {enableFilters && (
          <FilterBar
            estado={estado}
            onEstadoChange={setEstado}
            sortBy={sortBy}
            onSortByChange={(value) => setSortBy(value as any)}
            sortOrder={sortOrder}
            onSortOrderChange={toggleSortOrder}
          />
        )}
      </div>

      {/* Grid de noticias */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <NoticiaCardSkeleton key={i} showImage={true} />
          ))}
        </div>
      ) : noticiasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground mb-2">No se encontraron noticias</p>
          {searchTerm && (
            <Button variant="link" onClick={handleSearchClear}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
      ) : (
        <NormalGrid
          noticias={noticiasFiltradas}
          variant={variant}
          onNoticiaHover={handleNoticiaHover}
        />
      )}
    </div>
  );
});
