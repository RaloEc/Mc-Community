'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon, StarIcon, XIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Noticia, CategoriaNoticia } from '@/types';
import AdBanner from '@/components/ads/AdBanner';
import AdRectangle from '@/components/ads/AdRectangle';

// Tipos para controlar mejor los filtros
type FiltroActivo = {
  tipo: string;
  valor: string;
  etiqueta: string;
};

// Usamos el tipo CategoriaNoticia importado
type Categoria = CategoriaNoticia;

// Tipo para anuncios
type Anuncio = {
  id: number;
  titulo: string;
  contenido: string;
  esAnuncio: true; // Literal type para facilitar discriminación
};

// Tipo unión para manejar noticias y anuncios
type NoticiaConAnuncio = Noticia | Anuncio;

// Type guard para distinguir entre Noticia y Anuncio
function esAnuncio(item: NoticiaConAnuncio): item is Anuncio {
  return 'esAnuncio' in item && item.esAnuncio === true;
}

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
  filtrosAbiertos = false,
  onToggleFiltros = () => {},
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
  
  // Estado para controlar el modal de filtros en móvil
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Referencia para el timeout de búsqueda
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Definir el número de columnas según el prop
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1 max-w-4xl mx-auto',
    2: 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto',
  };
  
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
  }, [categorias, categoria]);
  
  // Usamos un callback para la función de carga de noticias
  const fetchNoticias = useCallback(async () => {
    try {
      setLoading(true);
      
      // Usar URL absoluta para evitar problemas con Next.js
      let baseUrl;
      if (typeof window !== 'undefined') {
        baseUrl = window.location.origin;
      } else {
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 (process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` :
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                 'http://localhost:3000'));
      }
      
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
  }, [filtrosAplicados]);
  
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
  }, [fetchNoticias]);
  
  // Efecto para detectar cambios en las props de filtros
  useEffect(() => {
    // No ejecutamos esto en la primera carga
    if (initialMount.current) return;
    
    // Si cambian las props, actualizamos los filtros locales
    if (busqueda !== busquedaLocal) setBusquedaLocal(busqueda);
    if (autor !== autorLocal) setAutorLocal(autor);
    if (categoria !== categoriaLocal) setCategoriaLocal(categoria);
    if (ordenFecha !== ordenFechaLocal) setOrdenFechaLocal(ordenFecha);
    
    // Y también actualizamos los filtros aplicados
    setFiltrosAplicados({
      busqueda,
      autor,
      categoria,
      ordenFecha
    });
    
    // Actualizamos los filtros activos
    actualizarFiltrosActivos(busqueda, autor, categoria, ordenFecha);
    
    // Marcamos que cambiaron los filtros para saber que debemos recargar las noticias
    filtersChanged.current = true;
  }, [busqueda, autor, categoria, ordenFecha, actualizarFiltrosActivos]);
  
  // Efecto para cargar las categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch('/api/categorias');
        if (!response.ok) throw new Error('Error al cargar categorías');
        const data = await response.json();
        
        // Ordenar categorías jerárquicamente (primero las que no tienen padre)
        const categoriasOrdenadas = [...data].sort((a, b) => {
          // Primero por parent_id (null primero)
          if (!a.parent_id && b.parent_id) return -1;
          if (a.parent_id && !b.parent_id) return 1;
          // Luego por orden si existe
          if (a.orden !== undefined && b.orden !== undefined) {
            return a.orden - b.orden;
          }
          // Finalmente por nombre
          return a.nombre.localeCompare(b.nombre);
        });
        
        setCategorias(categoriasOrdenadas);
        if (onCategoriasLoaded) onCategoriasLoaded(categoriasOrdenadas);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    
    cargarCategorias();
  }, [onCategoriasLoaded]);
  
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

    // Marcamos que cambiaron los filtros para saber que debemos recargar las noticias
    filtersChanged.current = true;
  }, [busquedaLocal, autorLocal, categoriaLocal, ordenFechaLocal]);

  // Función para manejar cambios en los campos de búsqueda con debounce
  const handleInputChange = useCallback((valor: string, tipo: 'busqueda' | 'autor' | 'categoria') => {
    // Actualizamos el estado local
    if (tipo === 'busqueda') {
      setBusquedaLocal(valor);
    } else if (tipo === 'autor') {
      setAutorLocal(valor);
    } else if (tipo === 'categoria') {
      setCategoriaLocal(valor);
    }

    // Si el usuario borra el campo, aplicamos el filtro inmediatamente
    if (valor === '') {
      setFiltrosAplicados(prev => ({
        ...prev,
        [tipo]: valor
      }));

      // Actualizar filtros activos
      const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== tipo);
      setFiltrosActivos(nuevosFiltros);

      // Si hay un timeout pendiente, lo limpiamos
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Si está escribiendo, esperamos un momento antes de aplicar el filtro
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setFiltrosAplicados(prev => ({
          ...prev,
          [tipo]: valor
        }));

        // Actualizar filtros activos
        const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== tipo);
        if (valor) {
          nuevosFiltros.push({
            tipo,
            valor,
            etiqueta: `${tipo === 'busqueda' ? 'Búsqueda' : 'Autor'}: ${valor}`
          });
        }
        setFiltrosActivos(nuevosFiltros);

        // Marcar que los filtros han cambiado
        filtersChanged.current = true;
      }, 500);
    }
  }, [filtrosActivos]);

  // Renderizar el selector de orden
  const renderOrdenSelector = () => (
    <select
      value={ordenFechaLocal}
      onChange={(e) => {
        const valor = e.target.value as 'asc' | 'desc';
        setOrdenFechaLocal(valor);
        setFiltrosAplicados(prev => ({
          ...prev,
          ordenFecha: valor
        }));

        // Actualizar filtros activos
        const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== 'ordenFecha');
        if (valor !== 'desc') {
          nuevosFiltros.push({
            tipo: 'ordenFecha',
            valor,
            etiqueta: `Orden: ${valor === 'asc' ? 'Más antiguas primero' : 'Más recientes primero'}`
          });
        }
        setFiltrosActivos(nuevosFiltros);

        // Marcar que los filtros han cambiado
        filtersChanged.current = true;
      }}
      className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
    >
      <option value="desc">Más recientes primero</option>
      <option value="asc">Más antiguas primero</option>
    </select>
  );

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusquedaLocal('');
    setAutorLocal('');
    setCategoriaLocal('');
    setOrdenFechaLocal('desc');
    setFiltrosAplicados({
      busqueda: '',
      autor: '',
      categoria: '',
      ordenFecha: 'desc'
    });
    setFiltrosActivos([]);
    filtersChanged.current = true;
  };

  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: string) => {
    const nuevosFiltros = filtrosActivos.filter(f => f.tipo !== tipo);
    setFiltrosActivos(nuevosFiltros);
    
    // Actualizar los estados según el tipo de filtro eliminado
    if (tipo === 'busqueda') {
      setBusquedaLocal('');
      setFiltrosAplicados(prev => ({ ...prev, busqueda: '' }));
    } else if (tipo === 'autor') {
      setAutorLocal('');
      setFiltrosAplicados(prev => ({ ...prev, autor: '' }));
    } else if (tipo === 'categoria') {
      setCategoriaLocal('');
      setFiltrosAplicados(prev => ({ ...prev, categoria: '' }));
    } else if (tipo === 'ordenFecha') {
      setOrdenFechaLocal('desc');
      setFiltrosAplicados(prev => ({ ...prev, ordenFecha: 'desc' }));
    }
    
    filtersChanged.current = true;
  };

  // Función para renderizar el contenido de las noticias
  const renderContenidoNoticias = () => {
    // Función para insertar anuncios entre las noticias
    const insertarAnuncios = (items: Noticia[]): NoticiaConAnuncio[] => {
      if (items.length <= 3) return items as NoticiaConAnuncio[];
      
      // Creamos una copia del array para no mutar el original
      const resultado = [...items] as NoticiaConAnuncio[];
      
      // Insertamos un marcador para un anuncio después de la tercera noticia
      resultado.splice(3, 0, { id: -1, titulo: '', contenido: '', esAnuncio: true });
      
      // Si hay más de 8 noticias, insertamos otro anuncio
      if (items.length > 8) {
        resultado.splice(8, 0, { id: -2, titulo: '', contenido: '', esAnuncio: true });
      }
      
      return resultado;
    };
    
    // Noticias con anuncios insertados
    const noticiasConAnuncios: NoticiaConAnuncio[] = insertarAnuncios(noticias);
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }

    if (noticias.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron noticias con los filtros seleccionados.</p>
        </div>
      );
    }

    return (
      <div className={`grid ${gridCols[columnas]} gap-6 w-full`}>
        {noticiasConAnuncios.map((item: NoticiaConAnuncio) => (
          esAnuncio(item) ? (
            <div key={item.id} className="col-span-full flex justify-center my-4">
              {item.id === -1 ? (
                <AdBanner className="w-full max-w-4xl" />
              ) : (
                <AdRectangle className="" />
              )}
            </div>
          ) : (
            <div key={item.id} className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/50 relative">
              <div className="relative h-48 overflow-hidden">
                {/* Categorías en la esquina superior izquierda */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.categorias && item.categorias.length > 0 ? (
                    (() => {
                      // Buscar categorías padres (sin parent_id)
                      const categoriasPadre = item.categorias.filter(c => !c.parent_id);
                      
                      // Si hay categorías padre, mostrar la primera
                      if (categoriasPadre.length > 0) {
                        const cat = categoriasPadre[0];
                        return (
                          <Badge 
                            key={cat.id} 
                            className={`text-xs ${cat.color ? `border-${cat.color}-500 ` : ''}`}
                            variant="outline"
                          >
                            {cat.icono && <span className="mr-1">{cat.icono}</span>}
                            {cat.nombre}
                          </Badge>
                        );
                      } 
                      // Si no hay categorías padre, buscar la primera subcategoría y su padre
                      else {
                        const primerSubcategoria = item.categorias[0];
                        const categoriaPadre = primerSubcategoria.parent_id ? 
                          item.categorias.find(c => c.id === primerSubcategoria.parent_id) : null;
                        
                        if (categoriaPadre) {
                          return (
                            <Badge 
                              key={categoriaPadre.id} 
                              className={`text-xs ${categoriaPadre.color ? `border-${categoriaPadre.color}-500 ` : ''}`}
                              variant="outline"
                            >
                              {categoriaPadre.icono && <span className="mr-1">{categoriaPadre.icono}</span>}
                              {categoriaPadre.nombre}
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge 
                              key={primerSubcategoria.id} 
                              className={`text-xs ${primerSubcategoria.color ? `border-${primerSubcategoria.color}-500 ` : ''}`}
                              variant="outline"
                            >
                              {primerSubcategoria.icono && <span className="mr-1">{primerSubcategoria.icono}</span>}
                              {primerSubcategoria.nombre}
                            </Badge>
                          );
                        }
                      }
                    })()
                  ) : item.categoria ? (
                    <Badge 
                      className={`text-xs ${item.categoria.color ? `border-${item.categoria.color}-500 ` : ''}`}
                      variant="outline"
                    >
                      {item.categoria.icono && <span className="mr-1">{item.categoria.icono}</span>}
                      {item.categoria.nombre}
                    </Badge>
                  ) : null}
                </div>
                
                {(item.imagen_url || (item as any).imagen_portada) ? (
                  <Image 
                    src={item.imagen_url || (item as any).imagen_portada} 
                    alt={item.titulo} 
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Error al cargar imagen de noticia en lista');
                      // Ocultar la imagen y mostrar el fallback
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/40');
                      const fallback = document.createElement('span');
                      fallback.className = 'text-primary-foreground text-lg font-medium absolute inset-0 flex items-center justify-center';
                      fallback.textContent = 'MC Community';
                      e.currentTarget.parentElement?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <span className="text-primary-foreground text-lg font-medium">MC Community</span>
                  </div>
                )}
              </div>
              <div className="p-4 pb-8">
                <div className="flex items-center mb-2 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>{new Date(item.fecha_publicacion || '').toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  <Link href={`/noticias/${item.id}`} className="hover:text-primary transition-colors">
                    {item.titulo}
                  </Link>
                </h3>
                {mostrarResumen && item.contenido && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {item.contenido.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
                  </p>
                )}
                <div className="flex justify-end">
                  <Link href={`/noticias/${item.id}`} className="text-primary hover:text-primary/80 font-medium inline-flex items-center">
                      <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              {/* Autor posicionado en el borde inferior de toda la tarjeta */}
              {(item.autor_nombre || item.autor?.username) && (
                <span 
                  className="absolute bottom-2 left-4 text-xs text-muted-foreground"
                >
                  <Link 
                    href={`/perfil/${item.autor?.username || item.autor_nombre}`} 
                    className="text-sm hover:underline" 
                    style={{ color: item.autor?.color || item.autor_color || 'inherit' }}
                  >
                    {item.autor?.username || item.autor_nombre}
                  </Link>
                </span>
              )}
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {mostrarFiltros && (
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por título
                </label>
                <input
                  type="text"
                  id="busqueda"
                  value={busquedaLocal}
                  onChange={(e) => handleInputChange(e.target.value, 'busqueda')}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Buscar noticias..."
                />
              </div>
              <div className="flex-1">
                <label htmlFor="autor" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por autor
                </label>
                <input
                  type="text"
                  id="autor"
                  value={autorLocal}
                  onChange={(e) => handleInputChange(e.target.value, 'autor')}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Nombre del autor"
                />
              </div>
              <div className="w-full sm:w-48">
                <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                {renderOrdenSelector()}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por categoría
                </label>
                <select
                  id="categoria"
                  value={categoriaLocal}
                  onChange={(e) => {
                    setCategoriaLocal(e.target.value);
                    // No aplicamos el filtro inmediatamente, esperamos a que el usuario haga clic en "Aplicar"
                  }}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {/* Mostrar jerarquía con sangría para subcategorías */}
                      {cat.parent_id ? '— ' : ''}{cat.nombre} {cat.icono ? cat.icono : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 w-full justify-end">
              <button 
                id="clearFilters"
                className="p-[0.6rem] px-4 h-[38px] bg-[#333333] text-white rounded-[5px] whitespace-nowrap hover:opacity-90 flex-1 sm:flex-initial"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
              <button 
                id="applyFilters"
                className="p-[0.6rem] px-4 h-[38px] bg-[#0066cc] text-white rounded-[5px] whitespace-nowrap hover:opacity-90 flex-1 sm:flex-initial"
                onClick={aplicarFiltros}
              >
                Aplicar
              </button>
            </div>
          
            {filtrosActivos.length > 0 && (
              <div className="w-full bg-[#1a1a1a] p-2 rounded-md border border-[#333333]">
                <div className="text-xs text-gray-400 mb-1.5">Filtros activos:</div>
                <div className="flex flex-wrap gap-2">
                  {filtrosActivos.map((filtro, index) => (
                    <div 
                      key={index} 
                      className="inline-flex items-center bg-[#0066cc] text-white text-xs py-1 px-2 rounded-[15px] shadow-sm"
                    >
                      {filtro.etiqueta}
                      <button 
                        onClick={() => eliminarFiltro(filtro.tipo)}
                        className="ml-2 hover:text-opacity-80"
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
      
      {/* Contenido principal */}
      <div className="w-full flex justify-center">
        <div className="w-full">
          {renderContenidoNoticias()}
        </div>
      </div>
    </div>
  );
}
