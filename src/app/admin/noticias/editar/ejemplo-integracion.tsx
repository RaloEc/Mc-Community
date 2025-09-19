'use client'

import { useState, useEffect } from 'react'
import { ArbolCategorias } from '@/components/categorias/ArbolCategorias'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

// Ejemplo de integración del componente ArbolCategorias en la página de editar noticias
export function EditorCategoria({ 
  noticiaId,
  categoriaIdInicial, 
  onGuardar
}: { 
  noticiaId: string,
  categoriaIdInicial: string | null, 
  onGuardar: (exito: boolean, mensaje: string) => void
}) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(categoriaIdInicial)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
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
    if (categoriaSeleccionada === id.toString()) {
      setCategoriaSeleccionada(null)
    } else {
      setCategoriaSeleccionada(id.toString())
    }
  }

  // Guardar cambios de categoría
  const guardarCambios = async () => {
    if (!categoriaSeleccionada) {
      onGuardar(false, 'Debes seleccionar una categoría')
      return
    }
    
    setGuardando(true)
    
    try {
      // Ejemplo de llamada a la API para actualizar la categoría de la noticia
      const response = await fetch(`/api/admin/noticias/${noticiaId}/categoria`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoria_id: categoriaSeleccionada
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar la categoría')
      }
      
      onGuardar(true, 'Categoría actualizada correctamente')
    } catch (err: any) {
      console.error('Error al guardar categoría:', err)
      onGuardar(false, err.message || 'Error al guardar la categoría')
    } finally {
      setGuardando(false)
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
              seleccionadas={categoriaSeleccionada ? [categoriaSeleccionada] : []}
              onSeleccionar={handleSeleccionarCategoria}
              soloActivas={true}
              className="max-h-64 overflow-y-auto"
            />
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={guardarCambios} 
                disabled={guardando || categoriaSeleccionada === categoriaIdInicial}
              >
                {guardando ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Uso en el componente de editar noticia:
/*
// En el componente principal de editar noticia
const [noticia, setNoticia] = useState<any>(null)
const [toast, setToast] = useState<any>(null)

// En el JSX del formulario
<EditorCategoria
  noticiaId={noticia.id}
  categoriaIdInicial={noticia.categoria_id}
  onGuardar={(exito, mensaje) => {
    if (exito) {
      toast({
        description: mensaje
      })
    } else {
      toast({
        variant: "destructive",
        description: mensaje
      })
    }
  }}
/>
*/
