'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon, StarIcon, XIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Noticia } from '@/types';

// Tipos para controlar mejor los filtros
type FiltroActivo = {
  tipo: string;
  valor: string;
  etiqueta: string;
};

type Categoria = {
  id: string;
  nombre: string;
};

interface NoticiasListaProps {
  limit?: number;
  columnas?: 1 | 2 | 3;
  mostrarResumen?: boolean;
  className?: string;
  busqueda?: string;
  autor?: string;
  ordenFecha?: 'asc' | 'desc';
  categoria?: string;
  mostrarFiltros?: boolean;
  filtrosAbiertos?: boolean;
  onToggleFiltros?: (estado: boolean) => void;
  onFiltrosActivosChange?: (cantidad: number) => void;
  onCategoriasLoaded?: (categorias: Categoria[]) => void;
  onFiltrosActivosArrayChange?: (filtros: FiltroActivo[]) => void;
}

export default function NoticiasLista({
  limit = 6,
  columnas = 3,
  mostrarResumen = true,
  className = '',
  busqueda = '',
  autor = '',
  ordenFecha = 'desc',
  categoria = '',
  mostrarFiltros = false,
  filtrosAbiertos,
  onToggleFiltros,
  onFiltrosActivosChange,
  onCategoriasLoaded,
  onFiltrosActivosArrayChange
}: NoticiasListaProps) {
  // Estados principales
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // Referencias para evitar bucles infinitos
  const initialMount = useRef(true);
  const filtersChanged = useRef(false);
  const propsRef = useRef({ busqueda, autor, categoria, ordenFecha });
  
  // Estados para los filtros en la UI
  const [busquedaLocal, setBusquedaLocal] = useState(busqueda);
  const [autorLocal, setAutorLocal] = useState(autor);
  const [categoriaLocal, setCategoriaLocal] = useState(categoria);
  const [ordenFechaLocal, setOrdenFechaLocal] = useState(ordenFecha);
  
  // Estado para los filtros aplicados (los que realmente afectan la consulta)
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    busqueda,
    autor,
    categoria,
    ordenFecha
  });
  
  // Estado para los filtros activos (mostrados en la UI)
  const [filtrosActivos, setFiltrosActivos] = useState<FiltroActivo[]>([]);
  
  // Estado para la visibilidad de filtros en móvil
  const [filtrosVisibles, setFiltrosVisibles] = useState(
    filtrosAbiertos !== undefined ? filtrosAbiertos : false
  );
  
  // Ya no usamos estados para animaciones

  // Efecto para sincronizar el estado de filtrosVisibles con la prop filtrosAbiertos
  useEffect(() => {
    if (filtrosAbiertos !== undefined && filtrosAbiertos !== filtrosVisibles) {
      setFiltrosVisibles(filtrosAbiertos);
    }
  }, [filtrosAbiertos, filtrosVisibles]);
  
  // Inicializamos los filtros activos en la primera renderización
  useEffect(() => {
    // Actualizamos los filtros según las props iniciales
    if (busqueda || autor || categoria || ordenFecha !== 'desc') {
      actualizarFiltrosActivos(busqueda, autor, categoria, ordenFecha);
    }
  }, []);

  
  // Efecto para notificar al componente padre sobre cambios en filtros activos
  useEffect(() => {
    // Solo notificamos cuando no es la primera carga
    if (!initialMount.current) {
      if (onFiltrosActivosChange) {
        onFiltrosActivosChange(filtrosActivos.length);
      }
      if (onFiltrosActivosArrayChange) {
        onFiltrosActivosArrayChange(filtrosActivos);
      }
    }
  }, [filtrosActivos, onFiltrosActivosChange, onFiltrosActivosArrayChange]);
  
  // Función para actualizar filtros activos (los que se muestran en la UI)
  const actualizarFiltrosActivos = useCallback((busqueda: string, autor: string, categoria: string, ordenFecha: 'asc' | 'desc') => {
    const nuevosFiltros: FiltroActivo[] = [];
    
    if (busqueda) {
      nuevosFiltros.push({
        tipo: 'busqueda',
        valor: busqueda,
        etiqueta: `Título: ${busqueda}`
      });
    }
    
    if (autor) {
      nuevosFiltros.push({
        tipo: 'autor',
        valor: autor,
        etiqueta: `Autor: ${autor}`
      });
    }
    
    if (categoria && categorias.length > 0) {
      // Intentamos encontrar la categoría por ID
      const categoriaSeleccionada = categorias.find(c => c.id === categoria);
      nuevosFiltros.push({
        tipo: 'categoria',
        valor: categoria,
        etiqueta: `Categoría: ${categoriaSeleccionada ? categoriaSeleccionada.nombre : categoria}`
      });
    } else if (categoria) {
      // Si hay categoría pero aún no se han cargado las categorías
      nuevosFiltros.push({
        tipo: 'categoria',
        valor: categoria,
        etiqueta: `Categoría: ${categoria}`
      });
    }
    
    if (ordenFecha !== 'desc') {
      nuevosFiltros.push({
        tipo: 'ordenFecha',
        valor: ordenFecha,
        etiqueta: `Orden: Más antiguas primero`
      });
    }
    
    setFiltrosActivos(nuevosFiltros);
  }, [categorias, categoria]);  // Añadimos categoria como dependencia para evitar bucles infinitos
  
  // Usamos un callback para la función de carga de noticias
  const fetchNoticias = useCallback(async () => {
    try {
      setLoading(true);
      
      // Usar URL absoluta para evitar problemas con Next.js
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000';
      
      // Construir URL con parámetros de búsqueda y filtros
      let url = `${baseUrl}/api/noticias?`;
      
      // Añadir parámetros de búsqueda y filtros si existen
      const { busqueda, autor, ordenFecha, categoria } = filtrosAplicados;
      if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
      if (autor) url += `&autor=${encodeURIComponent(autor)}`;
      if (ordenFecha) url += `&ordenFecha=${ordenFecha}`;
      if (categoria) url += `&categoria=${encodeURIComponent(categoria)}`;
      
      console.log('Obteniendo noticias desde:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener noticias: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Actualizar las noticias inmediatamente sin animaciones
        setNoticias(data.data);
        setLoading(false);
      } else {
        throw new Error('Formato de datos inválido');
      }
    } catch (error) {
      console.error('Error al cargar noticias:', error);
      setError('Error al cargar las noticias');
      setLoading(false);
    }
  }, [filtrosAplicados]);  // Quitamos noticias como dependencia para evitar actualizaciones innecesarias
  
  // Efecto para cargar las noticias cuando se aplican los filtros o en la carga inicial
  useEffect(() => {
    if (initialMount.current) {
      // En la primera carga, iniciamos la carga de noticias directamente
      initialMount.current = false;
      fetchNoticias();
    } else if (filtersChanged.current) {
      // Si los filtros cambiaron externamente, cargamos las noticias
      filtersChanged.current = false;
      fetchNoticias();
    }
  }, [fetchNoticias]);  // Quitamos filtrosAplicados como dependencia para evitar actualizaciones innecesarias
  
  // Ya no necesitamos el efecto para limpiar animaciones
  
  // Efecto para detectar cambios en las props de filtros
  useEffect(() => {
    // No ejecutamos esto en la primera carga
    if (initialMount.current) return;
    
    // Verificamos si las props han cambiado realmente
    const propsHanCambiado = 
      propsRef.current.busqueda !== busqueda ||
      propsRef.current.autor !== autor ||
      propsRef.current.categoria !== categoria ||
      propsRef.current.ordenFecha !== ordenFecha;
    
    if (propsHanCambiado) {
      // Actualizamos la referencia de props anteriores
      propsRef.current = { busqueda, autor, categoria, ordenFecha };
      
      // Actualizamos los estados locales con los valores de las props
      setBusquedaLocal(busqueda);
      setAutorLocal(autor);
      setCategoriaLocal(categoria);
      setOrdenFechaLocal(ordenFecha);
      
      // Actualizamos los filtros aplicados y los filtros activos
      setFiltrosAplicados({
        busqueda,
        autor,
        categoria,
        ordenFecha
      });
      
      // Marcamos que cambiaron los filtros para saber que debemos recargar las noticias
      filtersChanged.current = true;
    }
  }, [busqueda, autor, categoria, ordenFecha]);
  
  // Función para aplicar los filtros con debounce
  const aplicarFiltros = useCallback(() => {
    console.log('Aplicando filtros:', {
      busqueda: busquedaLocal,
      autor: autorLocal,
      categoria: categoriaLocal,
      ordenFecha: ordenFechaLocal
    });
    
    // Actualizamos el estado centralizado de filtros aplicados
    setFiltrosAplicados({
      busqueda: busquedaLocal,
      autor: autorLocal,
      categoria: categoriaLocal,
      ordenFecha: ordenFechaLocal
    });
    
    // Actualizamos los filtros activos que se muestran en la UI
    actualizarFiltrosActivos(busquedaLocal, autorLocal, categoriaLocal, ordenFechaLocal);
    
    // Marcamos que los filtros han cambiado para que se actualicen las noticias
    filtersChanged.current = true;
  }, [busquedaLocal, autorLocal, categoriaLocal, ordenFechaLocal, actualizarFiltrosActivos]);
  
  // Función para manejar cambios en los campos de búsqueda con aplicación inmediata
  const handleInputChange = (valor: string, tipo: 'busqueda' | 'autor') => {
    // Actualizar el estado local inmediatamente para la UI
    if (tipo === 'busqueda') {
      setBusquedaLocal(valor);
    } else {
      setAutorLocal(valor);
    }
    
    // Actualizar filtros activos
    const nuevosFiltros = [...filtrosActivos.filter(f => f.tipo !== tipo)];
    
    if (valor) {
      nuevosFiltros.push({
        tipo,
        valor,
        etiqueta: tipo === 'busqueda' ? `Título: ${valor}` : `Autor: ${valor}`
      });
    }
    
    // Verificar si los filtros han cambiado realmente antes de actualizar
    const filtrosIguales = filtrosActivos.length === nuevosFiltros.length &&
      filtrosActivos.every((filtro, index) => 
        filtro.tipo === nuevosFiltros[index]?.tipo && 
        filtro.valor === nuevosFiltros[index]?.valor
      );
    
    if (!filtrosIguales) {
      setFiltrosActivos(nuevosFiltros);
    }
  };
  
  // Función para limpiar todos los filtros
  const limpiarFiltros = useCallback(() => {
    // Restablecemos todos los estados de filtros locales
    setBusquedaLocal('');
    setAutorLocal('');
    setCategoriaLocal('');
    setOrdenFechaLocal('desc');
    
    // Actualizamos los filtros aplicados
    setFiltrosAplicados({
      busqueda: '',
      autor: '',
      categoria: '',
      ordenFecha: 'desc'
    });
    
    // Limpiamos los filtros activos en la UI
    setFiltrosActivos([]);
    
    // Marcamos que los filtros han cambiado
    filtersChanged.current = true;
  }, []);
  
  // Función para eliminar un filtro específico
  const eliminarFiltro = useCallback((tipo: string) => {
    // Creamos una copia del estado actual de filtros
    const nuevosFiltrosAplicados = { ...filtrosAplicados };
    
    // Actualizamos los estados locales y los filtros aplicados según el tipo
    switch(tipo) {
      case 'busqueda':
        setBusquedaLocal('');
        nuevosFiltrosAplicados.busqueda = '';
        break;
      case 'autor':
        setAutorLocal('');
        nuevosFiltrosAplicados.autor = '';
        break;
      case 'categoria':
        setCategoriaLocal('');
        nuevosFiltrosAplicados.categoria = '';
        break;
      case 'ordenFecha':
        setOrdenFechaLocal('desc');
        nuevosFiltrosAplicados.ordenFecha = 'desc';
        break;
    }
    
    // Actualizamos los filtros aplicados
    setFiltrosAplicados(nuevosFiltrosAplicados);
    
    // Actualizamos la lista de filtros activos en la UI
    const nuevosFiltros = filtrosActivos.filter(filtro => filtro.tipo !== tipo);
    setFiltrosActivos(nuevosFiltros);
    
    // Marcamos que los filtros han cambiado
    filtersChanged.current = true;
  }, [filtrosActivos, filtrosAplicados]);

  // Efecto para cargar las categorías disponibles
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/categorias`);
        
        if (!response.ok) {
          console.error('Error al obtener categorías');
          return;
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setCategorias(data.data);
          if (onCategoriasLoaded) {
            onCategoriasLoaded(data.data);
          }
          
          // Si hay filtro de categoría, actualizamos los filtros activos con el nombre correcto
          if (categoria && filtrosActivos.some(f => f.tipo === 'categoria')) {
            // Creamos una copia de los filtros activos
            const nuevosFiltros = filtrosActivos.map(f => {
              if (f.tipo === 'categoria') {
                // Buscamos la categoría por ID
                const categoriaEncontrada = data.data.find(c => c.id === categoria);
                if (categoriaEncontrada) {
                  return {
                    ...f,
                    etiqueta: `Categoría: ${categoriaEncontrada.nombre}`
                  };
                }
              }
              return f;
            });
            
            // Actualizamos los filtros activos solo si cambiaron
            if (JSON.stringify(nuevosFiltros) !== JSON.stringify(filtrosActivos)) {
              setFiltrosActivos(nuevosFiltros);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };

    fetchCategorias();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determinar el número de columnas para la cuadrícula con mejor distribución responsiva
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  // Contenido para mostrar según el estado de carga y resultados
  const renderContenidoNoticias = () => {
    // Solo mostrar el mensaje de carga si no hay noticias previas
    if (loading && noticias.length === 0) {
      return (
        <div className="text-center py-6 w-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-[#333333]"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 w-32 rounded bg-[#333333]"></div>
                <div className="h-2 w-24 rounded bg-[#333333]"></div>
              </div>
            </div>
            <p className="text-muted-foreground">Cargando noticias...</p>
          </div>
        </div>
      );
    }
    
    // Si está cargando pero ya hay noticias, mostrar las noticias actuales con efecto de carga
    if (loading && noticias.length > 0) {
      return (
        <div className={`grid gap-3 ${gridCols[columnas]} w-full  ease-in-out`}>
          {noticias.map((noticia) => (
            <article 
              key={`loading-${noticia.id}`}
              className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-amoled-gray w-full animate-pulse"
            >
              <div className="relative h-44 w-full overflow-hidden bg-[#333333]/30">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              </div>
              
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-0">
                <div className="h-5 w-16 bg-[#333333]/30 rounded-md"></div>
              </div>
              <div className="flex flex-col space-y-1 px-3 pt-2 pb-3">
                <div className="h-5 w-full bg-[#333333]/30 rounded-md mt-1"></div>
                <div className="h-4 w-3/4 bg-[#333333]/30 rounded-md"></div>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-6 w-full">
          <p className="text-red-500">Error: {error}</p>
        </div>
      );
    }

    if (noticias.length === 0) {
      return (
        <div className="text-center py-6 w-full">
          <p className="text-muted-foreground">No hay noticias que coincidan con tu búsqueda. Intenta con otros criterios.</p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${gridCols[columnas]} w-full  ease-in-out`}>
        {/* Noticias actuales con animación de entrada */}
        {noticias.map((noticia) => (
          <article 
            key={`current-${noticia.id}`}
            className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-amoled-gray w-full  motion-reduce:animate-none"
          >
            <div className="relative h-44 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <Image
                src={noticia.imagen_portada || 'https://placehold.co/600x400/1a1a1a/44bd32?text=Minecraft+News'}
                alt={noticia.titulo}
                fill
                unoptimized
                priority
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {noticia.destacada && (
                <Badge 
                  className="absolute top-4 left-4 z-20 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 border-none shadow-md animate-shimmer bg-[length:200%_100%] font-medium flex items-center gap-1 px-2.5 py-1"
                  variant="default"
                >
                  <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-950" />
                  Destacada
                </Badge>
              )}

            </div>
            
            <div className="flex items-center gap-1.5 px-3 pt-2 pb-0">
              {noticia.categorias && noticia.categorias.length > 0 ? (
                <>
                  {noticia.categorias.slice(0, 1).map((cat) => (
                    <span 
                      key={cat.id}
                      className="text-xs font-medium truncate px-2 py-0.5 rounded-md bg-primary/90 text-primary-foreground shadow-sm transition-colors hover:bg-primary/100"
                    >
                      {cat.nombre}
                    </span>
                  ))}
                  {noticia.categorias.length > 1 && (
                    <span 
                      className="text-xs font-medium bg-blue-700/90 text-white rounded-md px-2 py-0.5 shadow-sm transition-colors hover:bg-blue-700"
                      title={noticia.categorias.slice(1).map(cat => cat.nombre).join(', ')}
                    >
                      +{noticia.categorias.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-600/90 text-white shadow-sm transition-colors hover:bg-slate-600">General</span>
              )}
            </div>
            <div className="flex flex-col space-y-1 px-3 pt-2 pb-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <time>
                    {new Date(noticia.fecha_publicacion || noticia.created_at || Date.now()).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
                {(noticia.autor_nombre || noticia.autor) && (
                  <span 
                    style={{ color: noticia.autor_color || '#3b82f6' }}
                    className="font-medium text-xs"
                    title={`Autor: ${noticia.autor_nombre || noticia.autor}`}
                  >
                    {noticia.autor_nombre || noticia.autor}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold leading-tight tracking-tight mt-1">
                {noticia.titulo}
              </h2>
              {mostrarResumen && (
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {noticia.resumen || (noticia.contenido ? noticia.contenido.substring(0, 120).replace(/<\/?[^>]+(>|$)/g, '') + '...' : '')}
                </p>
              )}
              <div className="pt-2 mt-auto">
                <Button 
                  variant="link" 
                  className="px-0 text-primary text-sm h-auto py-0" 
                  asChild
                >
                  <Link href={`/noticias/${noticia.id}`}>
                    Leer más
                    <ArrowRightIcon className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Barra de búsqueda y filtros - con botón para mostrar/ocultar en móvil */}
      {mostrarFiltros && (
        <div className={`bg-[#121212] p-4 rounded-[10px] mb-8 md:relative md:top-auto sticky top-0 z-10  ease-in-out ${!filtrosVisibles ? 'max-md:hidden' : ''}`}>
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="text-lg font-semibold">Filtros</h3>
            <button 
              onClick={() => {
                const nuevoEstado = !filtrosVisibles;
                setFiltrosVisibles(nuevoEstado);
                if (onToggleFiltros) {
                  onToggleFiltros(nuevoEstado);
                }
              }}
              className="md:hidden p-1 hover:bg-gray-800 rounded-full transition-colors duration-200"
              aria-label={filtrosVisibles ? "Ocultar filtros" : "Mostrar filtros"}
            >
              {filtrosVisibles ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
            </button>
          </div>
          <div className={`flex flex-col gap-3 items-stretch ${filtrosVisibles ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
              <input 
                type="text" 
                id="titleSearch" 
                placeholder="Buscar por título..." 
                className="p-[0.6rem] border border-[#333333] rounded-[5px] bg-black text-white h-[38px] w-full "
                value={busquedaLocal}
                onChange={(e) => handleInputChange(e.target.value, 'busqueda')}
              />
              
              {/* Campo de autor oculto pero manteniendo la funcionalidad */}
              <input 
                type="text" 
                id="authorSearch" 
                placeholder="Buscar por autor..." 
                className="hidden p-[0.6rem] border border-[#333333] rounded-[5px] bg-black text-white h-[38px] w-full "
                value={autorLocal}
                onChange={(e) => handleInputChange(e.target.value, 'autor')}
              />
              
              <select 
                id="categoryFilter"
                className="p-[0.6rem] border border-[#333333] rounded-[5px] bg-black text-white h-[38px] w-full "
                value={categoriaLocal}
                onChange={(e) => {
                  setCategoriaLocal(e.target.value);
                  setFiltrosAplicados(prev => ({
                    ...prev,
                    categoria: e.target.value
                  }));
                  // Actualizar filtros activos
                  if (e.target.value) {
                    const categoriaSeleccionada = categorias.find(c => c.id === e.target.value);
                    const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== 'categoria');
                    nuevosFiltros.push({
                      tipo: 'categoria',
                      valor: e.target.value,
                      etiqueta: `Categoría: ${categoriaSeleccionada ? categoriaSeleccionada.nombre : e.target.value}`
                    });
                    setFiltrosActivos(nuevosFiltros);
                  } else {
                    setFiltrosActivos(filtrosActivos.filter(f => f.tipo !== 'categoria'));
                  }
                }}
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              
              <select 
                id="dateSort"
                className="p-[0.6rem] border border-[#333333] rounded-[5px] bg-black text-white h-[38px] w-full "
                value={ordenFechaLocal}
                onChange={(e) => {
                  const valor = e.target.value as 'asc' | 'desc';
                  setOrdenFechaLocal(valor);
                  setFiltrosAplicados(prev => ({
                    ...prev,
                    ordenFecha: valor
                  }));
                  
                  // Actualizar filtros activos
                  if (valor !== 'desc') {
                    const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== 'ordenFecha');
                    nuevosFiltros.push({
                      tipo: 'ordenFecha',
                      valor: valor,
                      etiqueta: `Orden: Más antiguas primero`
                    });
                    setFiltrosActivos(nuevosFiltros);
                  } else {
                    setFiltrosActivos(filtrosActivos.filter(f => f.tipo !== 'ordenFecha'));
                  }
                  
                  // Marcar que los filtros han cambiado
                  filtersChanged.current = true;
                }}
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguas primero</option>
              </select>
            </div>
            
            <div className="flex gap-2 w-full justify-end">
              <button 
                id="clearFilters"
                className="p-[0.6rem] px-4 h-[38px] bg-[#333333] text-white rounded-[5px] whitespace-nowrap hover:opacity-90  flex-1 sm:flex-initial"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
              <button 
                id="applyFilters"
                className="p-[0.6rem] px-4 h-[38px] bg-[#0066cc] text-white rounded-[5px] whitespace-nowrap hover:opacity-90  flex-1 sm:flex-initial"
                onClick={aplicarFiltros}
              >
                Aplicar
              </button>
            </div>
          
          {filtrosActivos.length > 0 && (
            <div className="w-full bg-[#1a1a1a] p-2 rounded-md border border-[#333333] ">
              <div className="text-xs text-gray-400 mb-1.5">Filtros activos:</div>
              <div className="flex flex-wrap gap-2 ">
                {filtrosActivos.map((filtro, index) => (
                  <div 
                    key={index} 
                    className="inline-flex items-center bg-[#0066cc] text-white text-xs py-1 px-2 rounded-[15px]   shadow-sm"
                  >
                    {filtro.etiqueta}
                    <button 
                      onClick={() => eliminarFiltro(filtro.tipo)}
                      className="ml-2 hover:text-opacity-80 "
                      aria-label="Eliminar filtro"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
      
      {/* Contenido de noticias sin animaciones */}
      <div>
        {renderContenidoNoticias()}
      </div>
    </div>
  );
}
