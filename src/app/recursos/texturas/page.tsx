'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, Download, ArrowLeft, Star } from 'lucide-react'
import { Textura } from '@/types'
import { supabase } from '@/lib/supabase'

// Datos de ejemplo para las texturas (se usarán si no hay datos de la base de datos)
const texturasEjemplo = [
  {
    id: 1,
    nombre: 'Faithful 32x',
    descripcion: 'Una versión mejorada de las texturas vanilla con mayor resolución.',
    version: '1.19',
    autor: 'Faithful Team',
    url_descarga: 'https://example.com/faithful',
    imagen: '/images/recursos/faithful.jpg',
    resolucion: '32x32',
    categoria: 'Fiel al juego',
    fecha_publicacion: '2023-08-05',
    destacado: true
  },
  {
    id: 2,
    nombre: 'Patrix',
    descripcion: 'Pack de texturas realistas de alta resolución.',
    version: '1.19.2',
    autor: 'Patrix Team',
    url_descarga: 'https://example.com/patrix',
    imagen: '/images/recursos/patrix.jpg',
    resolucion: '128x128',
    categoria: 'Realista',
    fecha_publicacion: '2023-09-15',
    destacado: false
  },
  {
    id: 3,
    nombre: 'Bare Bones',
    descripcion: 'Texturas minimalistas inspiradas en el estilo de los trailers oficiales.',
    version: '1.19',
    autor: 'RobotPants',
    url_descarga: 'https://example.com/barebones',
    imagen: '/images/recursos/bare-bones.jpg',
    resolucion: '16x16',
    categoria: 'Minimalista',
    fecha_publicacion: '2023-07-10',
    destacado: false
  },
  {
    id: 4,
    nombre: 'Sphax PureBDCraft',
    descripcion: 'Pack de texturas con estilo de cómic y colores vibrantes.',
    version: '1.19.2',
    autor: 'Sphax',
    url_descarga: 'https://example.com/sphax',
    imagen: '/images/recursos/sphax.jpg',
    resolucion: '64x64',
    categoria: 'Caricatura',
    fecha_publicacion: '2023-08-22',
    destacado: true
  },
  {
    id: 5,
    nombre: 'Jicklus',
    descripcion: 'Pack de texturas medieval con un estilo rústico y detallado.',
    version: '1.19',
    autor: 'Jicklus',
    url_descarga: 'https://example.com/jicklus',
    imagen: '/images/recursos/jicklus.jpg',
    resolucion: '32x32',
    categoria: 'Medieval',
    fecha_publicacion: '2023-06-18',
    destacado: false
  },
  {
    id: 6,
    nombre: 'Dokucraft',
    descripcion: 'Pack de texturas de fantasía con un estilo RPG detallado.',
    version: '1.19.2',
    autor: 'Dokucraft Team',
    url_descarga: 'https://example.com/dokucraft',
    imagen: '/images/recursos/dokucraft.jpg',
    resolucion: '64x64',
    categoria: 'Fantasía',
    fecha_publicacion: '2023-09-30',
    destacado: true
  }
]

// Categorías para filtrar
const categorias = ['Fiel al juego', 'Realista', 'Minimalista', 'Caricatura', 'Medieval', 'Fantasía']

export default function TexturasPage() {
  const [texturas, setTexturas] = useState<Textura[]>(texturasEjemplo)
  const [cargando, setCargando] = useState(true)
  
  useEffect(() => {
    async function cargarTexturas() {
      try {
        setCargando(true)
        
        // Intentar cargar texturas desde la base de datos
        const { data, error } = await supabase
          .from('texturas')
          .select('*')
        
        if (error) {
          console.error('Error al cargar texturas:', error)
          return
        }
        
        // Si hay datos, actualizar el estado
        if (data && data.length > 0) {
          setTexturas(data)
        }
      } catch (error) {
        console.error('Error al cargar texturas:', error)
      } finally {
        setCargando(false)
      }
    }
    
    cargarTexturas()
  }, [])
  
  return (
    <div className="min-h-screen bg-background">      
      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/recursos" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Packs de Texturas
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Transforma el aspecto visual de tu mundo de Minecraft con estos packs de texturas
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {categorias.map(categoria => (
              <Badge key={categoria} variant="outline" className="cursor-pointer hover:bg-accent">
                {categoria}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {texturas.map(textura => (
              <Card key={textura.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="h-40 bg-accent/50 flex items-center justify-center">
                  <Palette className="h-12 w-12 text-primary/60" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{textura.nombre}</CardTitle>
                    <Badge>{textura.categoria}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">v{textura.version}</span>
                    <span className="text-xs">Para Minecraft</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{textura.descripcion}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Resolución:</span>
                      <p className="font-medium">{textura.resolucion}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{textura.autor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{textura.autor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Categoría:</span>
                      <p className="font-medium">{textura.categoria}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Link href={`/recursos/texturas/${textura.id}`} className="flex items-center justify-center w-full">
                      Ver detalles
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <a href={textura.url_descarga} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
