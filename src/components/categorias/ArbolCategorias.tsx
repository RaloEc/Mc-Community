'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, Folder, File } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Tipos
export interface CategoriaBase {
  id: string | number
  nombre: string
  slug?: string
  descripcion?: string
  orden?: number
  color?: string
  es_activa?: boolean
  noticias_count?: number
  parent_id?: string | null
  categoria_padre_id?: string | null
  nivel?: number
  hijos?: CategoriaBase[]
  subcategorias?: CategoriaBase[] // Para compatibilidad con la API
}

export interface ArbolCategoriasProps {
  categorias: CategoriaBase[]
  seleccionadas?: (string | number)[]
  onSeleccionar?: (id: string | number) => void
  seleccionMultiple?: boolean
  className?: string
  mostrarContador?: boolean
  mostrarBadgeActivo?: boolean
  soloActivas?: boolean
  expandirTodo?: boolean
  estiloVisual?: 'simple' | 'arbol' | 'tabla' | 'admin'
  mostrarIconos?: boolean
  colorPorNivel?: boolean
}

export function ArbolCategorias({
  categorias,
  seleccionadas = [],
  onSeleccionar,
  seleccionMultiple = false,
  className = '',
  mostrarContador = false,
  mostrarBadgeActivo = false,
  soloActivas = false,
  expandirTodo = false,
  estiloVisual = 'arbol',
  mostrarIconos = true,
  colorPorNivel = true
}: ArbolCategoriasProps) {
  // Inicializar expandidas con todas las categorías si expandirTodo es true
  const [expandidas, setExpandidas] = useState<Set<string | number>>(() => {
    if (expandirTodo) {
      return new Set(categorias.map(cat => cat.id))
    }
    return new Set()
  })
  
  // Actualizar expandidas cuando cambia expandirTodo
  useEffect(() => {
    if (expandirTodo) {
      setExpandidas(new Set(categorias.map(cat => cat.id)))
    }
  }, [expandirTodo, categorias])

  const toggleExpandir = (id: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    const nuevasExpandidas = new Set(expandidas)
    if (nuevasExpandidas.has(id)) {
      nuevasExpandidas.delete(id)
    } else {
      nuevasExpandidas.add(id)
    }
    setExpandidas(nuevasExpandidas)
  }

  const estaSeleccionada = (id: string | number) => {
    return seleccionadas.includes(id)
  }

  // Separamos la lógica de expansión y selección para mayor claridad
  const manejarSeleccion = (categoria: CategoriaBase, e?: React.MouseEvent) => {
    // Si no hay callback de selección o la categoría está inactiva y solo queremos activas, no hacemos nada
    if (!onSeleccionar || (soloActivas && categoria.es_activa === false)) {
      return
    }
    
    // Llamamos al callback de selección
    onSeleccionar(categoria.id)
  }
  
  // Función para manejar el clic en una categoría
  const handleCategoriaClick = (categoria: CategoriaBase, e: React.MouseEvent) => {
    // Verificar si la categoría tiene hijos o subcategorías
    const tieneHijos = categoria.hijos && categoria.hijos.length > 0
    // Verificar si la categoría tiene subcategorías en la propiedad subcategorias (compatibilidad)
    const tieneSubcategorias = categoria.subcategorias && categoria.subcategorias.length > 0
    
    // Manejar tanto la expansión como la selección
    if (tieneHijos || tieneSubcategorias) {
      // Expandir/colapsar la categoría
      toggleExpandir(categoria.id, e)
      
      // Si también queremos seleccionar la categoría al hacer clic
      if (onSeleccionar) {
        manejarSeleccion(categoria, e)
      }
    } else {
      // Si no tiene hijos, solo manejamos la selección
      manejarSeleccion(categoria, e)
    }
  }

  // Función para obtener el color según el nivel
  const getColorPorNivel = (nivel: number) => {
    if (!colorPorNivel) return ''
    
    switch (nivel) {
      case 0: return 'text-blue-700'
      case 1: return 'text-green-700'
      case 2: return 'text-purple-700'
      default: return 'text-gray-700'
    }
  }
  
  // Función para obtener el icono según el nivel y estado
  const getIcono = (nivel: number, tieneHijos: boolean, expandido: boolean) => {
    if (estiloVisual === 'admin') {
      // Iconos para el estilo admin, similar a la página de administración
      switch (nivel) {
        case 0: return <span className="text-lg">📁</span> // 📁 es el emoji de carpeta (📁)
        case 1: return <span className="text-lg">📂</span> // 📂 es el emoji de carpeta abierta (📂)
        case 2: return <span className="text-lg">📄</span> // 📄 es el emoji de documento (📄)
        default: return <span className="text-lg">📄</span>
      }
    } else {
      // Iconos para los otros estilos
      if (nivel === 0) {
        return expandido ? <FolderOpen size={16} className="text-blue-600" /> : <Folder size={16} className="text-blue-600" />
      } else if (nivel === 1) {
        return expandido ? <FolderOpen size={16} className="text-green-600" /> : <Folder size={16} className="text-green-600" />
      } else {
        return <File size={16} className="text-purple-600" />
      }
    }
  }
  
  // Función para obtener la indentación visual
  const getIndentacion = (nivel: number) => {
    if (estiloVisual === 'admin') {
      // Indentación para el estilo admin, similar a la página de administración
      const baseIndent = '  '.repeat(Math.max(0, nivel - 1))
      switch (nivel) {
        case 0: return ''
        case 1: return ''
        case 2: return baseIndent + '├─ '
        case 3: return baseIndent + '│  └─ '
        default: return baseIndent + '│     └─ '
      }
    } else {
      // Indentación para los otros estilos
      if (estiloVisual === 'arbol') {
        switch (nivel) {
          case 0: return ''
          case 1: return '├─ '
          case 2: return '│  └─ '
          default: return '│     └─ '
        }
      } else {
        return ''
      }
    }
  }

  const renderizarCategoria = (categoria: CategoriaBase, nivel = 0) => {
    // Si soloActivas es true y la categoría no está activa, no la mostramos
    if (soloActivas && categoria.es_activa === false) {
      return null
    }
    
    // Verificar si tiene hijos o subcategorias
    const hijosArray = categoria.hijos || [];
    const subcategoriasArray = categoria.subcategorias || [];
    
    // Combinar ambos arrays para compatibilidad
    const todosLosHijos = [...hijosArray, ...subcategoriasArray];
    
    const tieneHijos = todosLosHijos.length > 0;
    const expandida = expandidas.has(categoria.id);
    const hijosVisibles = tieneHijos && (expandida || expandirTodo);
    
    // Filtrar hijos activos si soloActivas es true
    const hijosAMostrar = soloActivas
      ? todosLosHijos.filter(hijo => hijo.es_activa !== false)
      : todosLosHijos;
      
    // Renderizar el ícono de expansión/colapso
    const renderizarIconoExpansion = () => {
      if (!tieneHijos) return <span className="w-5"></span>; // Espaciador para mantener la alineación
      
      return (
        <span className="flex items-center justify-center w-5 h-5 mr-1 text-gray-500 hover:bg-gray-100 rounded">
          {expandida ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      );
    };

    // Si no tiene hijos visibles después del filtro, ajustamos la variable
    const mostrarHijos = hijosAMostrar && hijosAMostrar.length > 0
    
    // Determinar el estilo de fondo según el nivel y si está seleccionada
    const getBgStyle = () => {
      // Base styles para todos los casos
      let baseStyle = 'transition-all duration-150 ease-in-out'
      
      // Estilo admin especial
      if (estiloVisual === 'admin') {
        // Si está seleccionada
        if (estaSeleccionada(categoria.id)) {
          return 'bg-blue-50/80 border-blue-200'
        }
        
        // Si tiene hijos, añadir estilo especial para indicar que es desplegable
        if (tieneHijos) {
          baseStyle = 'cursor-pointer hover:bg-muted/50'
        }
        
        return baseStyle
      }
      
      // Estilos para los otros modos visuales
      // Si está seleccionada
      if (estaSeleccionada(categoria.id)) {
        return `${baseStyle} bg-blue-50 border-blue-200 shadow-sm`
      }
      
      // Si tiene hijos, añadir estilo especial para indicar que es desplegable
      if (tieneHijos) {
        baseStyle += ' hover:shadow-sm hover:border hover:border-gray-200'
      }
      
      // Colores por nivel
      if (colorPorNivel) {
        switch (nivel) {
          case 0: return `${baseStyle} hover:bg-blue-50/70`
          case 1: return `${baseStyle} hover:bg-green-50/70`
          case 2: return `${baseStyle} hover:bg-purple-50/70`
          default: return `${baseStyle} hover:bg-gray-100`
        }
      }
      
      return `${baseStyle} hover:bg-gray-100`
    }

    // Renderizado especial para el estilo admin
    if (estiloVisual === 'admin') {
      return (
        <div key={categoria.id} className="categoria-item mb-1">
          <div 
            className={`flex items-center py-1.5 px-2 rounded-sm
                      ${getBgStyle()}
                      ${categoria.es_activa === false ? 'opacity-60' : ''}`}
            onClick={(e) => handleCategoriaClick(categoria, e)}
            title={tieneHijos ? `Clic para expandir/colapsar ${categoria.nombre}` : onSeleccionar ? `Seleccionar ${categoria.nombre}` : categoria.nombre}
          >
            {/* Ícono de expansión/colapso */}
            {renderizarIconoExpansion()}
            
            {/* Icono para estilo admin */}
            {mostrarIconos && (
              <span className="mr-1.5">
                {getIcono(nivel, tieneHijos, expandida)}
              </span>
            )}
            
            {/* Indentación visual para estilo admin */}
            <span className="text-sm text-muted-foreground font-mono">{getIndentacion(nivel)}</span>
            
            {/* Nombre de la categoría con estilo admin */}
            <span className={nivel === 0 ? 'font-bold' : nivel === 1 ? 'font-medium' : 'font-normal'}>
              {categoria.nombre}
            </span>
            
            {/* Contador de hijos para estilo admin */}
            {tieneHijos && (
              <Badge variant="outline" className="ml-2 text-xs">
                {hijosAMostrar?.length || 0}
              </Badge>
            )}
            
            {/* Contador de noticias para estilo admin */}
            {mostrarContador && categoria.noticias_count !== undefined && (
              <Badge
                variant="secondary"
                className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-200"
              >
                {categoria.noticias_count}
              </Badge>
            )}
            
            {/* Indicador de selección para estilo admin */}
            {estaSeleccionada(categoria.id) && onSeleccionar && (
              <div className="ml-auto flex items-center justify-center h-4 w-4 rounded-full bg-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </div>
          
          {/* Hijos de la categoría para estilo admin - con animación */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${!mostrarHijos || !hijosVisibles ? 'h-0 opacity-0' : 'opacity-100'}`}
            style={{ maxHeight: mostrarHijos && hijosVisibles ? '1000px' : '0px' }}
          >
            <div className="pl-6">
              {hijosAMostrar?.map(hijo => renderizarCategoria(hijo, nivel + 1))}
            </div>
          </div>
        </div>
      );
    }
    
    // Renderizado para los otros estilos
    return (
      <div key={categoria.id} className={`mb-1 ${estiloVisual === 'tabla' ? 'border-b border-gray-100' : ''}`}>
        <div 
          className={`flex items-center py-1.5 px-2 rounded-sm
                    ${getBgStyle()}
                    ${categoria.es_activa === false ? 'opacity-60' : ''}
                    ${tieneHijos ? 'cursor-pointer hover:scale-[1.01]' : onSeleccionar ? 'cursor-pointer' : ''}`}
          style={{ 
            paddingLeft: estiloVisual === 'simple' ? `${nivel * 1.5}rem` : '0.5rem'
          }}
          onClick={(e) => handleCategoriaClick(categoria, e)}
          title={tieneHijos ? `Clic para expandir/colapsar ${categoria.nombre}` : onSeleccionar ? `Seleccionar ${categoria.nombre}` : categoria.nombre}
        >
          {/* Botón de expansión/colapso */}
          {tieneHijos ? (
            <div className="flex items-center justify-center w-5 h-5 mr-1 text-gray-500 hover:bg-gray-100 rounded transition-colors">
              {expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-5 mr-1"></div>
          )}
          
          {/* Icono según el tipo de categoría */}
          {mostrarIconos && (
            <span className="mr-1.5">
              {getIcono(nivel, tieneHijos, expandida)}
            </span>
          )}
          
          {/* Indentación visual para estilo árbol */}
          {estiloVisual === 'arbol' && nivel > 0 && (
            <span className="text-xs text-gray-400 font-mono mr-1">{getIndentacion(nivel)}</span>
          )}
          
          {/* Nombre de la categoría */}
          <span 
            className={`
              ${categoria.es_activa === false ? 'text-gray-400' : getColorPorNivel(nivel)}
              ${nivel === 0 ? 'font-medium' : ''}
              ${tieneHijos ? 'group flex items-center' : ''}
            `}
          >
            {categoria.nombre}
            {tieneHijos && (
              <span className="ml-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                ({hijosAMostrar?.length || 0})
              </span>
            )}
          </span>
          
          {/* Contador de noticias */}
          {mostrarContador && categoria.noticias_count !== undefined && (
            <Badge 
              variant="secondary" 
              className={`ml-2 ${nivel === 0 ? 'bg-blue-100' : nivel === 1 ? 'bg-green-100' : 'bg-purple-100'}`}
            >
              {categoria.noticias_count}
            </Badge>
          )}
          
          {/* Badge de estado activo/inactivo */}
          {mostrarBadgeActivo && (
            categoria.es_activa === false ? (
              <Badge variant="outline" className="ml-2 text-xs bg-gray-100">
                Inactiva
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                Activa
              </Badge>
            )
          )}
          
          {/* Botón de selección para categorías con hijos */}
          {tieneHijos && onSeleccionar && (
            <div 
              className={`ml-auto flex items-center justify-center h-5 w-5 rounded-full ${estaSeleccionada(categoria.id) ? 'bg-blue-500' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={(e) => {
                e.stopPropagation(); // Evitar que se propague al padre
                manejarSeleccion(categoria, e);
              }}
              title={estaSeleccionada(categoria.id) ? 'Deseleccionar categoría' : 'Seleccionar categoría'}
            >
              {estaSeleccionada(categoria.id) ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )}
            </div>
          )}
          
          {/* Indicador de selección para categorías sin hijos */}
          {!tieneHijos && estaSeleccionada(categoria.id) && (
            <div className="ml-auto flex items-center justify-center h-4 w-4 rounded-full bg-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
        </div>
        
        {/* Hijos de la categoría - con animación */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${!mostrarHijos || !hijosVisibles ? 'h-0 opacity-0' : 'opacity-100'}`}
          style={{ maxHeight: mostrarHijos && hijosVisibles ? '1000px' : '0px' }}
        >
          <div className={estiloVisual === 'simple' ? 'pt-1' : 'ml-6 pl-2 border-l border-gray-200 pt-1'}>
            {hijosAMostrar?.map(hijo => renderizarCategoria(hijo, nivel + 1))}
          </div>
        </div>
      </div>
    )
  }

  // Filtrar categorías activas si soloActivas es true
  const categoriasActivas = soloActivas 
    ? categorias.filter(cat => cat.es_activa !== false)
    : categorias
  
  // Logs para depuración
  console.log('Categorias recibidas:', categorias)
  
  // Determinar qué categorías mostrar
  const categoriasAMostrar = categoriasActivas

  // Función para verificar si una categoría tiene hijos visibles
  const tieneHijosVisibles = (categoria: CategoriaBase): boolean => {
    // Combinar hijos y subcategorias para compatibilidad
    const hijosArray = categoria.hijos || [];
    const subcategoriasArray = categoria.subcategorias || [];
    const todosLosHijos = [...hijosArray, ...subcategoriasArray];
    
    if (todosLosHijos.length === 0) return false;
    
    if (soloActivas) {
      return todosLosHijos.some(hijo => {
        // Verificar si el hijo está activo
        const hijoActivo = hijo.es_activa !== false;
        
        // Verificar si el hijo tiene hijos visibles
        const tieneHijos = hijo.hijos?.length > 0 || hijo.subcategorias?.length > 0;
        const hijosVisibles = tieneHijos ? tieneHijosVisibles(hijo) : true;
        
        return hijoActivo && hijosVisibles;
      });
    }
    
    return true;
  }

  return (
    <div className={`overflow-y-auto max-h-96 border rounded p-2 ${className}`}>
      <div className="space-y-0.5">
        {categoriasAMostrar
          .filter(cat => !soloActivas || cat.es_activa !== false)
          .map(categoria => renderizarCategoria(categoria))}
      </div>
      
      {/* Mensaje cuando no hay categorías para mostrar */}
      {categoriasAMostrar.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No hay categorías disponibles
        </div>
      )}
    </div>
  )
}
