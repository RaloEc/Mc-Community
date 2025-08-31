'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import NoticiasLista from '@/components/NoticiasLista'
import FiltrosBtnFlotante from '@/components/FiltrosBtnFlotante';
import FiltrosModal from '@/components/FiltrosModal';
import FiltrosDesktop from '@/components/FiltrosDesktop';
import { CategoriaNoticia } from '@/types';

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
  const [categoria, setCategoria] = useState<string>('');
  const [ordenFecha, setOrdenFecha] = useState<'asc' | 'desc'>('desc');
  const [categorias, setCategorias] = useState<CategoriaNoticia[]>([]);
  const [filtrosActivosArray, setFiltrosActivosArray] = useState<{tipo: string, valor: string, etiqueta: string}[]>([]);
  
  // Estados para los valores temporales del modal (para no aplicar cambios hasta que se haga clic en Aplicar)
  const [busquedaTemp, setBusquedaTemp] = useState('');
  const [autorTemp, setAutorTemp] = useState('');
  const [categoriaTemp, setCategoriaTemp] = useState<string>('');
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
      setCategoria(searchParams.get('categoria') || '');
      
      // Guardamos el nombre de la categoría para buscarlo después
      console.log('Categoría en URL:', urlCategoria);
    }
    if (urlOrden === 'asc' || urlOrden === 'desc') setOrdenFecha(urlOrden);
    
  }, [searchParams]);
  
  // Efecto para actualizar los filtros activos cuando se cargan las categorías
  useEffect(() => {
    if (categorias.length > 0 && categoria) {
      // Primero verificamos si tenemos un ID o un nombre de categoría
      const categoriaId: string | number = categoria;
      
      const esCategoriaId = categorias.some(c => c.id === categoriaId);
      
      if (esCategoriaId) {
        // Ya tenemos un ID de categoría, actualizamos el array de filtros activos
        const categoriaEncontradaPorId = categorias.find(c => c.id === categoriaId);
        
        if (categoriaEncontradaPorId) {
          const nuevosFiltros = [...filtrosActivosArray.filter(f => f.tipo !== 'categoria')];
          
          nuevosFiltros.push({
            tipo: 'categoria',
            valor: String(categoriaId),
            etiqueta: `Categoría: ${categoriaEncontradaPorId.nombre}`
          });
          
          setFiltrosActivosArray(nuevosFiltros);
        }
      } else {
        // Es un nombre de categoría, buscar su ID
        const categoriaEncontradaPorNombre = categorias.find(c => 
          c.nombre.toLowerCase() === categoria.toString().toLowerCase()
        );
        
        console.log('Buscando categoría:', categoria);
        console.log('Categorías disponibles:', categorias.map(c => c.nombre));
        console.log('Categoría encontrada:', categoriaEncontradaPorNombre);
        
        if (categoriaEncontradaPorNombre) {
          // Actualizar el estado con el ID de la categoría
          setCategoria(String(categoriaEncontradaPorNombre.id));
          
          // Actualizar el array de filtros activos
          const nuevosFiltros = [...filtrosActivosArray.filter(f => f.tipo !== 'categoria')];
          
          nuevosFiltros.push({
            tipo: 'categoria',
            valor: String(categoriaEncontradaPorNombre.id),
            etiqueta: `Categoría: ${categoriaEncontradaPorNombre.nombre}`
          });
          
          setFiltrosActivosArray(nuevosFiltros);
        }
      }
    }
  }, [categorias, categoria, filtrosActivosArray]);
  
  // Función para convertir CategoriaNoticia[] a {id: string, nombre: string}[]
  const adaptarCategorias = (cats: CategoriaNoticia[]): {id: string, nombre: string}[] => {
    return cats.map(cat => ({
      id: String(cat.id),
      nombre: cat.nombre
    }));
  };

  // Efecto para actualizar los filtros activos cuando cambian los filtros
  useEffect(() => {
    // Actualizar los valores temporales con los valores reales
    setBusquedaTemp(busqueda);
    setAutorTemp(autor);
    setCategoriaTemp(categoria);
    setOrdenFechaTemp(ordenFecha);
  }, [busqueda, autor, categoria, ordenFecha]);
  
  // Función para eliminar un filtro específico
  const eliminarFiltro = (tipo: string) => {
    if (tipo === 'busqueda') setBusqueda('');
    if (tipo === 'autor') setAutor('');
    if (tipo === 'categoria') setCategoria('');
    if (tipo === 'ordenFecha') setOrdenFecha('desc');
    
    setFiltrosActivosArray(filtrosActivosArray.filter(f => f.tipo !== tipo));
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Noticias</h1>
        
        {/* Filtros de escritorio */}
        <div className="hidden md:block mb-6">
          <FiltrosDesktop 
            busqueda={busqueda}
            autor={autor}
            categoria={categoria}
            ordenFecha={ordenFecha}
            categorias={adaptarCategorias(categorias)}
            filtrosActivos={filtrosActivosArray}
            onBusquedaChange={setBusqueda}
            onAutorChange={setAutor}
            onCategoriaChange={setCategoria}
            onOrdenFechaChange={setOrdenFecha}
            onEliminarFiltro={eliminarFiltro}
            onLimpiarFiltros={() => {
              setBusqueda('');
              setAutor('');
              setCategoria('');
              setOrdenFecha('desc');
              setFiltrosActivosArray([]);
            }}
            onAplicarFiltros={() => {
              // Actualizar los filtros activos basados en los valores actuales
              const nuevosFiltros = [];
              if (busqueda) nuevosFiltros.push({tipo: 'busqueda', valor: busqueda, etiqueta: `Título: ${busqueda}`});
              if (autor) nuevosFiltros.push({tipo: 'autor', valor: autor, etiqueta: `Autor: ${autor}`});
              if (categoria) {
                const categoriaObj = categorias.find(c => c.id === categoria);
                if (categoriaObj) nuevosFiltros.push({tipo: 'categoria', valor: String(categoria), etiqueta: `Categoría: ${categoriaObj.nombre}`});
              }
              setFiltrosActivosArray(nuevosFiltros);
            }}
          />
        </div>
        
        <div className="max-w-[1600px] mx-auto">
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
              // Si hay una categoría en la URL, buscarla por nombre
              if (categoria && typeof categoria === 'string' && !categorias.some(c => c.id === categoria)) {
                const cat = cats.find(c => c.nombre.toLowerCase() === categoria.toLowerCase());
                if (cat) {
                  setCategoria(String(cat.id));
                }
              }
            }}
            onFiltrosActivosArrayChange={(filtros) => {
              setFiltrosActivosArray(filtros);
            }}
          />
        </div>
        
        {/* Botón flotante para abrir el modal de filtros */}
        <FiltrosBtnFlotante 
          modalAbierto={modalAbierto} 
          onAbrirModal={() => setModalAbierto(true)}
          hayFiltrosActivos={filtrosActivos > 0}
        />
        
        {/* Modal de filtros */}
        <FiltrosModal 
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          busqueda={busquedaTemp}
          autor={autorTemp}
          categoria={categoriaTemp}
          ordenFecha={ordenFechaTemp}
          categorias={adaptarCategorias(categorias)}
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
