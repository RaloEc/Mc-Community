import Header from '../../../components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, Download, ArrowLeft, Star } from 'lucide-react'

// Datos de ejemplo para las texturas
const texturas = [
  {
    id: 'faithful',
    nombre: 'Faithful 32x',
    descripcion: 'Una versión mejorada de las texturas vanilla con mayor resolución.',
    version: '1.19',
    compatibilidad: '1.19.x',
    autor: 'Faithful Team',
    descargas: '30M+',
    imagen: '/images/recursos/faithful.jpg',
    categoria: 'Fiel al juego',
    fechaActualizacion: '2023-08-05',
    resolucion: '32x32',
    valoracion: 4.8
  },
  {
    id: 'patrix',
    nombre: 'Patrix',
    descripcion: 'Pack de texturas realistas de alta resolución.',
    version: '1.19.2',
    compatibilidad: '1.19.2',
    autor: 'Patrix Team',
    descargas: '5M+',
    imagen: '/images/recursos/patrix.jpg',
    categoria: 'Realista',
    fechaActualizacion: '2023-09-15',
    resolucion: '128x128',
    valoracion: 4.7
  },
  {
    id: 'bare-bones',
    nombre: 'Bare Bones',
    descripcion: 'Texturas minimalistas inspiradas en el estilo de los trailers oficiales.',
    version: '1.19',
    compatibilidad: '1.19.x',
    autor: 'RobotPants',
    descargas: '8M+',
    imagen: '/images/recursos/bare-bones.jpg',
    categoria: 'Minimalista',
    fechaActualizacion: '2023-07-10',
    resolucion: '16x16',
    valoracion: 4.5
  },
  {
    id: 'sphax-purebdcraft',
    nombre: 'Sphax PureBDCraft',
    descripcion: 'Pack de texturas con estilo de cómic y colores vibrantes.',
    version: '1.19.2',
    compatibilidad: '1.19.2',
    autor: 'Sphax',
    descargas: '20M+',
    imagen: '/images/recursos/sphax.jpg',
    categoria: 'Caricatura',
    fechaActualizacion: '2023-08-22',
    resolucion: '64x64',
    valoracion: 4.6
  },
  {
    id: 'jicklus',
    nombre: 'Jicklus',
    descripcion: 'Pack de texturas medieval con un estilo rústico y detallado.',
    version: '1.19',
    compatibilidad: '1.19.x',
    autor: 'Jicklus',
    descargas: '3M+',
    imagen: '/images/recursos/jicklus.jpg',
    categoria: 'Medieval',
    fechaActualizacion: '2023-06-18',
    resolucion: '32x32',
    valoracion: 4.3
  },
  {
    id: 'dokucraft',
    nombre: 'Dokucraft',
    descripcion: 'Pack de texturas de fantasía con un estilo RPG detallado.',
    version: '1.19.2',
    compatibilidad: '1.19.2',
    autor: 'Dokucraft Team',
    descargas: '10M+',
    imagen: '/images/recursos/dokucraft.jpg',
    categoria: 'Fantasía',
    fechaActualizacion: '2023-09-30',
    resolucion: '64x64',
    valoracion: 4.9
  }
]

// Categorías para filtrar
const categorias = ['Fiel al juego', 'Realista', 'Minimalista', 'Caricatura', 'Medieval', 'Fantasía']

export default function TexturasPage() {
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
                    <span className="text-xs">Para MC {textura.compatibilidad}</span>
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
                      <span className="text-muted-foreground">Descargas:</span>
                      <p className="font-medium">{textura.descargas}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{textura.autor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valoración:</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{textura.valoracion}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Link href={`/recursos/texturas/${textura.id}`} className="flex items-center justify-center w-full">
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
