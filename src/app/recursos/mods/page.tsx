import Header from '../../../components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Blocks, Download, ArrowLeft } from 'lucide-react'

// Datos de ejemplo para los mods
const mods = [
  {
    id: 'create-mod',
    nombre: 'Create Mod',
    descripcion: 'Un mod que añade maquinaria y automatización con un estilo steampunk.',
    version: '0.5.1',
    compatibilidad: '1.19.2',
    autor: 'simibubi',
    descargas: '15M+',
    imagen: '/images/recursos/create-mod.jpg',
    categoria: 'Tecnología',
    fechaActualizacion: '2023-08-15'
  },
  {
    id: 'jei',
    nombre: 'Just Enough Items (JEI)',
    descripcion: 'Muestra recetas y usos de todos los items del juego.',
    version: '11.5.0',
    compatibilidad: '1.19.2',
    autor: 'mezz',
    descargas: '50M+',
    imagen: '/images/recursos/jei.jpg',
    categoria: 'Utilidad',
    fechaActualizacion: '2023-09-10'
  },
  {
    id: 'botania',
    nombre: 'Botania',
    descripcion: 'Mod de magia técnica basado en la naturaleza y las flores.',
    version: '1.19.2-437',
    compatibilidad: '1.19.2',
    autor: 'Vazkii',
    descargas: '20M+',
    imagen: '/images/recursos/botania.jpg',
    categoria: 'Magia',
    fechaActualizacion: '2023-07-22'
  },
  {
    id: 'applied-energistics',
    nombre: 'Applied Energistics 2',
    descripcion: 'Sistema de almacenamiento digital y automatización avanzada.',
    version: '12.9.2',
    compatibilidad: '1.19.2',
    autor: 'AlgorithmX2',
    descargas: '18M+',
    imagen: '/images/recursos/ae2.jpg',
    categoria: 'Tecnología',
    fechaActualizacion: '2023-10-05'
  },
  {
    id: 'tinkers-construct',
    nombre: 'Tinkers\' Construct',
    descripcion: 'Permite crear y personalizar herramientas con diferentes materiales y efectos.',
    version: '3.6.3',
    compatibilidad: '1.19.2',
    autor: 'boni',
    descargas: '25M+',
    imagen: '/images/recursos/tinkers.jpg',
    categoria: 'Herramientas',
    fechaActualizacion: '2023-06-30'
  },
  {
    id: 'biomes-o-plenty',
    nombre: 'Biomes O\' Plenty',
    descripcion: 'Añade más de 90 nuevos biomas al juego con flora y fauna única.',
    version: '17.1.1',
    compatibilidad: '1.19.2',
    autor: 'Forstride',
    descargas: '30M+',
    imagen: '/images/recursos/bop.jpg',
    categoria: 'Mundo',
    fechaActualizacion: '2023-09-28'
  }
]

// Categorías para filtrar
const categorias = ['Tecnología', 'Utilidad', 'Magia', 'Herramientas', 'Mundo', 'Aventura']

export default function ModsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
              Mods para Minecraft
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Descubre los mejores mods para expandir y mejorar tu experiencia de juego
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
            {mods.map(mod => (
              <Card key={mod.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="h-40 bg-accent/50 flex items-center justify-center">
                  <Blocks className="h-12 w-12 text-primary/60" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{mod.nombre}</CardTitle>
                    <Badge>{mod.categoria}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">v{mod.version}</span>
                    <span className="text-xs">Para MC {mod.compatibilidad}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{mod.descripcion}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{mod.autor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descargas:</span>
                      <p className="font-medium">{mod.descargas}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <p className="font-medium">{new Date(mod.fechaActualizacion).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Link href={`/recursos/mods/${mod.id}`} className="flex items-center justify-center w-full">
                      Ver detalles
                    </Link>
                  </Button>
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
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
