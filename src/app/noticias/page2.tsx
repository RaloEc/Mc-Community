'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import FiltrosBtnFlotante from '@/components/FiltrosBtnFlotante';
import FiltrosModal from '@/components/FiltrosModal';
import FiltrosDesktop from '@/components/FiltrosDesktop';
import NoticiasDestacadas from '@/components/noticias/NoticiasDestacadas';
import SeccionCategoria from '@/components/noticias/SeccionCategoria';
import NoticiasGrid from '@/components/noticias/NoticiasGrid';
import { useDebounce } from '@/hooks/use-debounce';

// Configuración ISR
export const revalidate = 300; // Revalidar cada 5 minutos

// Componente principal memoizado para optimización
const Noticias = memo(() => {
  // Obtener parámetros de la URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
  
  // Estado para controlar la apertura del modal de filtros
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState(0);
  
  // Estado para los filtros
  const [busqueda, setBusqueda] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ordenFecha, setOrdenFecha] = useState<'asc' | 'desc'>('desc');
  const [categorias, setCategorias] = useState<{id: string, nombre: string}[]>([]);
  const [filtrosActivosArray, setFiltrosActivosArray] = useState<{tipo: string, valor: string, etiqueta: string}[]>([]);
  
  // Aplicar debounce solo a la búsqueda para búsqueda en tiempo real
  const busquedaDebounced = useDebounce(busqueda, 400);
  
  // Estado para controlar la vista
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);
  
  // Referencia para evitar bucles infinitos
  const categoriaProcesada = useRef(false);
  
  // Estados para los valores temporales del modal (para no aplicar cambios hasta que se haga clic en Aplicar)
  const [busquedaTemp, setBusquedaTemp] = useState('');
  const [autorTemp, setAutorTemp] = useState('');
  const [categoriaTemp, setCategoriaTemp] = useState('');
  const [ordenFechaTemp, setOrdenFechaTemp] = useState<'asc' | 'desc'>('desc');

  // Consulta para obtener todas las categorías con prefetching
  const { data: todasCategorias = [] } = useQuery({
    queryKey: ['noticias', 'categorias'],
    queryFn: async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/categorias`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener categorías: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
        return [];
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos en caché
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
  });

  // Prefetch de categorías para mejorar rendimiento
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['noticias', 'categorias'],
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  // Memoizar las categorías destacadas
  const categoriasDestacadas = useMemo(() => {
    return todasCategorias.slice(0, 3);
  }, [todasCategorias]);

  // Actualizar el estado de categorías cuando se carguen
  useEffect(() => {
    if (todasCategorias.length > 0) {
      setCategorias(todasCategorias.map((cat: any) => ({
        id: String(cat.id),
        nombre: cat.nombre
      })));
    }
  }, [todasCategorias]);

  // Efecto para leer los parámetros de la URL y aplicar los filtros al cargar la página
  useEffect(() => {
    const urlBusqueda = searchParams.get('busqueda');
    const urlAutor = searchParams.get('autor');
    const urlCategoria = searchParams.get('categoria');
    const urlOrden = searchParams.get('orden');
    
    // Aplicar filtros desde la URL
    if (urlBusqueda) setBusqueda(urlBusqueda);
    if (urlAutor) setAutor(urlAutor);
    
    // Manejar la categoría de la URL
    if (urlCategoria) {
      // Si ya tenemos las categorías cargadas, buscamos la correspondiente
      if (categorias.length > 0) {
        const catEncontrada = categorias.find(cat => 
          cat.nombre.toLowerCase() === urlCategoria.toLowerCase() || 
          cat.id === urlCategoria
        );
        
        if (catEncontrada) {
          setCategoria(catEncontrada.id);
          setCategoriaTemp(catEncontrada.id);
          // Forzar recarga completa para asegurar que se carguen todas las noticias de la categoría
          setMostrarListaCompleta(true);
        }
      } else {
        // Si no tenemos las categorías aún, guardamos el valor para manejarlo después
        setCategoria(urlCategoria);
      }
    }
    
    // Manejar el orden
    if (urlOrden === 'asc' || urlOrden === 'desc') {
      setOrdenFecha(urlOrden);
      setOrdenFechaTemp(urlOrden);
    }
  }, [searchParams, categorias]);
  
  // Efecto para actualizar los filtros activos cuando se cargan las categorías
  useEffect(() => {
    // Si ya procesamos esta categoría o no hay categorías cargadas o no hay categoría seleccionada, no hacemos nada
    if (categoriaProcesada.current || categorias.length === 0 || !categoria) {
      return;
    }
    
    // Verificar si la categoría es un ID o un nombre
    const esCategoriaId = categorias.some(c => c.id === categoria);
    const categoriaEncontrada = esCategoriaId 
      ? categorias.find(c => c.id === categoria)
      : categorias.find(c => c.nombre.toLowerCase() === categoria.toLowerCase());
    
    if (categoriaEncontrada) {
      // Si la categoría actual no coincide con la encontrada, actualizarla
      if (categoria !== categoriaEncontrada.id) {
        setCategoria(categoriaEncontrada.id);
        setCategoriaTemp(categoriaEncontrada.id);
      }
      
      // Actualizar filtros activos
      const nuevosFiltros = filtrosActivosArray.filter(f => f.tipo !== 'categoria');
      
      nuevosFiltros.push({
        tipo: 'categoria',
        valor: categoriaEncontrada.id,
        etiqueta: `Categoría: ${categoriaEncontrada.nombre}`
      });
      
      setFiltrosActivosArray(nuevosFiltros);
      
      // Forzar recarga completa para asegurar que se carguen todas las noticias de la categoría
      setMostrarListaCompleta(true);
      
      // Marcar como procesada
      categoriaProcesada.current = true;
    }
  }, [categorias, categoria, filtrosActivosArray]);
  
  // Efecto para actualizar los filtros activos cuando cambian los filtros
  useEffect(() => {
    // Actualizar los valores temporales con los valores reales
    setBusquedaTemp(busqueda);
    setAutorTemp(autor);
    setCategoriaTemp(categoria);
    setOrdenFechaTemp(ordenFecha);
    
    // Actualizar el contador de filtros activos
    const activos = [];
    if (busqueda) activos.push({ tipo: 'busqueda', valor: busqueda, etiqueta: `Búsqueda: ${busqueda}` });
    if (autor) activos.push({ tipo: 'autor', valor: autor, etiqueta: `Autor: ${autor}` });
    if (categoria) {
      const cat = categorias.find(c => c.id === categoria);
      if (cat) {
        activos.push({ tipo: 'categoria', valor: categoria, etiqueta: `Categoría: ${cat.nombre}` });
      }
    }
    
    setFiltrosActivos(activos.length);
    setFiltrosActivosArray(activos);
    
    // Si hay algún filtro activo, mostrar la lista completa
    if (busqueda || autor || categoria || ordenFecha !== 'desc') {
      setMostrarListaCompleta(true);
    } else {
    }
  }, [busqueda, autor, categoria, ordenFecha, categorias]);
  
  // Función para eliminar un filtro específico (memoizada)
  const eliminarFiltro = useCallback((tipo: string) => {
    if (tipo === 'busqueda') {
      setBusqueda('');
      setBusquedaTemp('');
    } else if (tipo === 'autor') {
      setAutor('');
      setAutorTemp('');
    } else if (tipo === 'categoria') {
      setCategoria('');
      setCategoriaTemp('');
      // Resetear el estado de procesamiento para permitir seleccionar la misma categoría nuevamente
      categoriaProcesada.current = false;
    } else if (tipo === 'ordenFecha') {
      setOrdenFecha('desc');
      setOrdenFechaTemp('desc');
    }
    
    // Actualizar el array de filtros activos
    setFiltrosActivosArray(prev => prev.filter(f => f.tipo !== tipo));
    
    // Actualizar el contador de filtros activos
    setFiltrosActivos(prev => prev - 1);
    
    // Forzar recarga completa para asegurar que se carguen todas las noticias de la categoría seleccionada
    setMostrarListaCompleta(true);
  }, []);

  // Callback memoizado para limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setBusqueda('');
    setAutor('');
    setCategoria('');
    setOrdenFecha('desc');
    setFiltrosActivosArray([]);
    categoriaProcesada.current = false;
  }, []);

  // Detectar scroll infinito
  useEffect(() => {
    if (inView && mostrarListaCompleta) {
      // Trigger para cargar más noticias si es necesario
      console.log('Usuario llegó al final, cargar más noticias');
    }
  }, [inView, mostrarListaCompleta]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 container mx-auto px-4 py-6" role="main" aria-label="Página de noticias">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">Noticias</h1>
        
        {/* Filtros de escritorio */}
        <div className="hidden md:block mb-6">
          <FiltrosDesktop 
            busqueda={busqueda}
            autor={autor}
            categoria={categoria}
            ordenFecha={ordenFecha}
            categorias={categorias}
            filtrosActivos={filtrosActivosArray}
            onBusquedaChange={setBusqueda}
            onAutorChange={setAutor}
            onCategoriaChange={setCategoria}
            onOrdenFechaChange={setOrdenFecha}
            onEliminarFiltro={eliminarFiltro}
            onAplicarFiltros={() => {
              // No necesitamos hacer nada aquí porque los cambios se aplican inmediatamente
              console.log('Filtros aplicados desde escritorio');
            }}
            onLimpiarFiltros={limpiarFiltros}
          />
        </div>
        
        <div className="w-full max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            {mostrarListaCompleta ? (
              // Mostrar la lista completa con filtros aplicados usando el nuevo componente NoticiasGrid
              <motion.div
                key="lista-completa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <NoticiasGrid 
                  initialFiltros={{
                    busqueda: busquedaDebounced,
                    autor,
                    categoria,
                    ordenFecha
                  }}
                  columnas={3}
                  mostrarResumen={true}
                  limit={16}
                />
                {/* Referencia para scroll infinito */}
                <div ref={loadMoreRef} className="h-10" />
              </motion.div>
            ) : (
              // Mostrar la nueva estructura de página con secciones
              <motion.div
                key="secciones"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-10 w-full"
              >
                {/* Sección de noticias destacadas */}
                <section className="mb-8" aria-label="Últimas noticias">
                  <h2 className="text-2xl font-bold mb-4 text-foreground">Últimas Noticias</h2>
                  <NoticiasDestacadas limit={5} />
                </section>
                
                {/* Secciones por categoría */}
                {categoriasDestacadas.map((cat) => (
                  <section key={cat.id} className="mb-8" aria-label={`Noticias de ${cat.nombre}`}>
                    <SeccionCategoria 
                      categoriaId={cat.id} 
                      categoriaNombre={cat.nombre} 
                      limite={4} 
                    />
                  </section>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Botón flotante para abrir el modal de filtros */}
        <FiltrosBtnFlotante 
          modalAbierto={modalAbierto} 
          onAbrirModal={() => setModalAbierto(true)}
          hayFiltrosActivos={busqueda !== '' || categoria !== ''}
          aria-label="Abrir filtros de búsqueda"
        />
        
        {/* Modal de filtros */}
        <FiltrosModal 
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          busqueda={busquedaTemp}
          autor={autorTemp}
          categoria={categoriaTemp}
          ordenFecha={ordenFechaTemp}
          categorias={categorias}
          filtrosActivos={filtrosActivosArray}
          onBusquedaChange={setBusquedaTemp}
          onAutorChange={setAutorTemp}
          onCategoriaChange={setCategoriaTemp}
          onOrdenFechaChange={setOrdenFechaTemp}
          onAplicarFiltros={() => {
            // Aplicar los valores temporales a los valores reales
            setBusqueda(busquedaTemp);
            setAutor(autorTemp);
            setCategoria(categoriaTemp);
            setOrdenFecha(ordenFechaTemp);
            
            // Actualizar el array de filtros activos
            const nuevosFiltros = [];
            
            if (busquedaTemp) {
              nuevosFiltros.push({
                tipo: 'busqueda',
                valor: busquedaTemp,
                etiqueta: `Título: ${busquedaTemp}`
              });
            }
            
            if (autorTemp) {
              nuevosFiltros.push({
                tipo: 'autor',
                valor: autorTemp,
                etiqueta: `Autor: ${autorTemp}`
              });
            }
            
            if (categoriaTemp) {
              const categoriaSeleccionada = categorias.find(c => c.id === categoriaTemp);
              nuevosFiltros.push({
                tipo: 'categoria',
                valor: categoriaTemp,
                etiqueta: `Categoría: ${categoriaSeleccionada ? categoriaSeleccionada.nombre : categoriaTemp}`
              });
            }
            
            if (ordenFechaTemp !== 'desc') {
              nuevosFiltros.push({
                tipo: 'ordenFecha',
                valor: ordenFechaTemp,
                etiqueta: `Orden: Más antiguas primero`
              });
            }
            
            setFiltrosActivosArray(nuevosFiltros);
            console.log('Filtros aplicados:', nuevosFiltros);
          }}
          onLimpiarFiltros={() => {
            // Limpiar los valores temporales
            setBusquedaTemp('');
            setAutorTemp('');
            setCategoriaTemp('');
            setOrdenFechaTemp('desc');
            
            // Limpiar los valores reales
            limpiarFiltros();
          }}
          onEliminarFiltro={(tipo) => {
            if (tipo === 'busqueda') {
              setBusquedaTemp('');
              setBusqueda('');
            }
            if (tipo === 'autor') {
              setAutorTemp('');
              setAutor('');
            }
            if (tipo === 'categoria') {
              setCategoriaTemp('');
              setCategoria('');
            }
            if (tipo === 'ordenFecha') {
              setOrdenFechaTemp('desc');
              setOrdenFecha('desc');
            }
            setFiltrosActivosArray(filtrosActivosArray.filter(f => f.tipo !== tipo));
          }}
        />
      </main>
    </div>
  );
});

Noticias.displayName = 'Noticias';

export default Noticias;
