'use client'

import { useState, useEffect } from 'react'
import { ArbolCategorias } from '@/components/categorias/ArbolCategorias'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

// Ejemplo de integración del componente ArbolCategorias en la página de crear noticias
export function SelectorCategoria({ 
  categoriaId, 
  onChange 
}: { 
  categoriaId: string | null, 
  onChange: (id: string | null) => void 
}) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      setCargando(true)
      setError(null)
      
      try {
        const response = await fetch('/api/noticias/categorias')
        
        if (!response.ok) {
          throw new Error('Error al cargar las categorías')
        }
        
        const data = await response.json()
        setCategorias(data)
      } catch (err: any) {
        console.error('Error al cargar categorías:', err)
        setError(err.message || 'Error al cargar las categorías')
      } finally {
        setCargando(false)
      }
    }
    
    cargarCategorias()
  }, [])

  // Manejar la selección de categoría
  const handleSeleccionarCategoria = (id: string | number) => {
    // Si ya está seleccionada, la deseleccionamos
    if (categoriaId === id.toString()) {
      onChange(null)
    } else {
      onChange(id.toString())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categoría de la Noticia</CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="text-sm text-muted-foreground">Cargando categorías...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <>
            <Label htmlFor="categoria" className="mb-2 block">
              Selecciona una categoría para la noticia:
            </Label>
            <ArbolCategorias
              categorias={categorias}
              seleccionadas={categoriaId ? [categoriaId] : []}
              onSeleccionar={handleSeleccionarCategoria}
              soloActivas={true}
              className="max-h-64 overflow-y-auto"
            />
            {categoriaId && (
              <div className="mt-2 text-sm text-green-600">
                Categoría seleccionada correctamente
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Uso en el formulario de crear noticia:
/*
// En el componente principal de crear noticia
const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)

// En el JSX del formulario
<SelectorCategoria
  categoriaId={categoriaSeleccionada}
  onChange={setCategoriaSeleccionada}
/>

// Al enviar el formulario
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Validar que se haya seleccionado una categoría
  if (!categoriaSeleccionada) {
    toast({
      variant: "destructive",
      description: "Debes seleccionar una categoría para la noticia"
    })
    return
  }
  
  // Resto del código para enviar el formulario
  // ...
  
  // Incluir la categoría en los datos a enviar
  const datosNoticia = {
    // ...otros campos
    categoria_id: categoriaSeleccionada
  }
}
*/
