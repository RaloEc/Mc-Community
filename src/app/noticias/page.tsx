'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import NoticiasLista from '@/components/NoticiasLista'
import FiltrosBtnFlotante from '@/components/FiltrosBtnFlotante';
import FiltrosModal from '@/components/FiltrosModal';
import FiltrosDesktop from '@/components/FiltrosDesktop';
import NoticiasDestacadas from '@/components/NoticiasDestacadas';
import SeccionCategoria from '@/components/SeccionCategoria';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Noticias() {
  // Obtener parámetros de la URL
  const searchParams = useSearchParams();
  
  // Estado para controlar la apertura del modal de filtros
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState(0);
  
  // Estados para los filtros
  const [busqueda, setBusqueda] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ordenFecha, setOrdenFecha] = useState<'asc' | 'desc'>('desc');
  const [categorias, setCategorias] = useState<{id: string, nombre: string}[]>([]);
  const [filtrosActivosArray, setFiltrosActivosArray] = useState<{tipo: string, valor: string, etiqueta: string}[]>([]);
  
  // Estado para controlar la vista
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);
  const [categoriasDestacadas, setCategoriasDestacadas] = useState<{id: number, nombre: string}[]>([]);
  
  // Referencia para evitar bucles infinitos
  const categoriaProcesada = useRef(false);
  
  // Estados para los valores temporales del modal (para no aplicar cambios hasta que se haga clic en Aplicar)
  const [busquedaTemp, setBusquedaTemp] = useState('');
  const [autorTemp, setAutorTemp] = useState('');
  const [categoriaTemp, setCategoriaTemp] = useState('');
  const [ordenFechaTemp, setOrdenFechaTemp] = useState<'asc' | 'desc'>('desc');
  
  // Efecto para leer los parámetros de la URL y aplicar los filtros al cargar la página
  useEffect(() => {
    const urlBusqueda = searchParams.get('busqueda');
    const urlAutor = searchParams.get('autor');
    const urlCategoria = searchParams.get('categoria');
    const urlOrden = searchParams.get('orden');
    
    // Aplicar filtros desde la URL
    if (urlBusqueda) setBusqueda(urlBusqueda);
    if (urlAutor) setAutor(urlAutor);
    if (urlCategoria) {
      // Cuando carguen las categorías, buscaremos la que coincida con el nombre
      // El ID se asignará después cuando se carguen las categorías
      setCategoria(urlCategoria);
      
      // Guardamos el nombre de la categoría para buscarlo después
      console.log('Categoría en URL:', urlCategoria);
    }
    if (urlOrden === 'asc' || urlOrden === 'desc') setOrdenFecha(urlOrden);
    
  }, [searchParams]);
  
  // Efecto para actualizar los filtros activos cuando se cargan las categorías
  useEffect(() => {
    // Si ya procesamos esta categoría o no hay categorías cargadas o no hay categoría seleccionada, no hacemos nada
    if (categoriaProcesada.current || categorias.length === 0 || !categoria) {
      return;
    }
    
    // Primero verificamos si tenemos un ID o un nombre de categoría
    const esCategoriaId = categorias.some(c => c.id === categoria);
    
    if (esCategoriaId) {
      // Ya tenemos un ID de categoría, actualizamos el array de filtros activos
      const categoriaEncontradaPorId = categorias.find(c => c.id === categoria);
      
      if (categoriaEncontradaPorId) {
        const nuevosFiltros = [...filtrosActivosArray.filter(f => f.tipo !== 'categoria')];
        
        nuevosFiltros.push({
          tipo: 'categoria',
          valor: categoria,
          etiqueta: `Categoría: ${categoriaEncontradaPorId.nombre}`
        });
        
        setFiltrosActivosArray(nuevosFiltros);
        categoriaProcesada.current = true;
      }
    } else {
      // Es un nombre de categoría, buscar su ID
      const categoriaEncontradaPorNombre = categorias.find(c => 
        c.nombre.toLowerCase() === categoria.toLowerCase()
      );
      
      if (categoriaEncontradaPorNombre) {
        // Marcamos como procesada antes de actualizar el estado para evitar bucles
        categoriaProcesada.current = true;
        
        // Actualizar el estado con el ID de la categoría
        setCategoria(categoriaEncontradaPorNombre.id);
        
        // Actualizar el array de filtros activos
        const nuevosFiltros = [...filtrosActivosArray.filter(f => f.tipo !== 'categoria')];
        
        nuevosFiltros.push({
          tipo: 'categoria',
          valor: categoriaEncontradaPorNombre.id,
          etiqueta: `Categoría: ${categoriaEncontradaPorNombre.nombre}`
        });
        
        setFiltrosActivosArray(nuevosFiltros);
      }
    }
  }, [categorias, categoria, filtrosActivosArray]);
  
  // Efecto para actualizar los filtros activos cuando cambian los filtros
  useEffect(() => {
    // Actualizar los valores temporales con los valores reales
    setBusquedaTemp(busqueda);
    setAutorTemp(autor);
    setCategoriaTemp(categoria);
    setOrdenFechaTemp(ordenFecha);
    
    // Si hay algún filtro activo, mostrar la lista completa
    if (busqueda || autor || categoria || ordenFecha !== 'desc') {
      setMostrarListaCompleta(true);
    } else {
      setMostrarListaCompleta(false);
    }
  }, [busqueda, autor, categoria, ordenFecha]);
  
  // Efecto para cargar las categorías destacadas
  useEffect(() => {
    const cargarCategoriasDestacadas = async () => {
      try {
        // Usar URL absoluta para evitar problemas con Next.js
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/categorias`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener categorías: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Tomar las primeras 3 categorías como destacadas
          setCategoriasDestacadas(data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error al cargar categorías destacadas:', err);
      }
    };
    
    cargarCategoriasDestacadas();
  }, []);
  
  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: string) => {
    if (tipo === 'busqueda') setBusqueda('');
    if (tipo === 'autor') setAutor('');
    if (tipo === 'categoria') {
      setCategoria('');
      // Resetear el estado de procesamiento para permitir seleccionar la misma categoría nuevamente
      categoriaProcesada.current = false;
    }
    if (tipo === 'ordenFecha') setOrdenFecha('desc');
    
    setFiltrosActivosArray(filtrosActivosArray.filter(f => f.tipo !== tipo));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Noticias</h1>
        
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
            onLimpiarFiltros={() => {
              setBusqueda('');
              setAutor('');
              setCategoria('');
              setOrdenFecha('desc');
              setFiltrosActivosArray([]);
              // Resetear el estado de procesamiento
              categoriaProcesada.current = false;
            }}
          />
        </div>
        
        <div className="w-full max-w-[1600px] mx-auto">
          {mostrarListaCompleta ? (
            // Mostrar la lista completa con filtros aplicados
            <NoticiasLista 
              limit={16} 
              columnas={3} 
              mostrarResumen={true} 
              mostrarFiltros={false}
              busqueda={busqueda}
              autor={autor}
              categoria={categoria}
              ordenFecha={ordenFecha}
              onFiltrosActivosChange={(cantidad) => {
                setFiltrosActivos(cantidad);
              }}
              onCategoriasLoaded={(cats) => {
                setCategorias(cats);
              }}
              onFiltrosActivosArrayChange={(filtros) => {
                setFiltrosActivosArray(filtros);
              }}
            />
          ) : (
            // Mostrar la nueva estructura de página con secciones
            <div className="space-y-10 w-full">
              {/* Sección de noticias destacadas */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Últimas Noticias</h2>
                <NoticiasDestacadas limit={5} />
              </section>
              
              {/* Secciones por categoría */}
              {categoriasDestacadas.map((cat) => (
                <section key={cat.id} className="mb-8">
                  <SeccionCategoria 
                    categoriaId={cat.id} 
                    categoriaNombre={cat.nombre} 
                    limite={4} 
                  />
                </section>
              ))}
            </div>
          )}
        </div>
        
        {/* Botón flotante para abrir el modal de filtros */}
        <FiltrosBtnFlotante 
          modalAbierto={modalAbierto} 
          onAbrirModal={() => setModalAbierto(true)}
          hayFiltrosActivos={busqueda !== '' || categoria !== ''}
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
            setBusqueda('');
            setAutor('');
            setCategoria('');
            setOrdenFecha('desc');
            setFiltrosActivosArray([]);
            
            // Resetear el estado de procesamiento
            categoriaProcesada.current = false;
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
}
