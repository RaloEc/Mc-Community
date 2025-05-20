import Header from '../../../components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Download, ArrowLeft, Star, Cpu } from 'lucide-react'

// Datos de ejemplo para los shaders
const shaders = [
  {
    id: 'bsl',
    nombre: 'BSL Shaders',
    descripcion: 'Shaders con iluminación realista y efectos visuales avanzados.',
    version: '8.2.02',
    compatibilidad: '1.19.x',
    autor: 'Capt Tatsu',
    descargas: '10M+',
    imagen: '/images/recursos/bsl.jpg',
    categoria: 'Realista',
    fechaActualizacion: '2023-08-12',
    requisitos: 'Medio',
    valoracion: 4.9
  },
  {
    id: 'seus',
    nombre: 'SEUS (Sonic Ether\'s Unbelievable Shaders)',
    descripcion: 'Uno de los packs de shaders más populares con efectos visuales impresionantes.',
    version: '11.0',
    compatibilidad: '1.19.x',
    autor: 'Sonic Ether',
    descargas: '25M+',
    imagen: '/images/recursos/seus.jpg',
    categoria: 'Realista',
    fechaActualizacion: '2023-07-20',
    requisitos: 'Alto',
    valoracion: 4.8
  },
  {
    id: 'complementary',
    nombre: 'Complementary Shaders',
    descripcion: 'Shaders optimizados con gran calidad visual y rendimiento.',
    version: '4.6',
    compatibilidad: '1.19.x',
    autor: 'EminGT',
    descargas: '15M+',
    imagen: '/images/recursos/complementary.jpg',
    categoria: 'Balanceado',
    fechaActualizacion: '2023-09-05',
    requisitos: 'Medio',
    valoracion: 4.7
  },
  {
    id: 'sildurs',
    nombre: 'Sildur\'s Vibrant Shaders',
    descripcion: 'Shaders con colores vibrantes y múltiples opciones de configuración.',
    version: '1.32',
    compatibilidad: '1.19.x',
    autor: 'Sildur',
    descargas: '20M+',
    imagen: '/images/recursos/sildurs.jpg',
    categoria: 'Vibrante',
    fechaActualizacion: '2023-08-28',
    requisitos: 'Bajo-Medio',
    valoracion: 4.6
  },
  {
    id: 'chocapic',
    nombre: 'Chocapic13\'s Shaders',
    descripcion: 'Shaders con múltiples versiones para diferentes capacidades de hardware.',
    version: '9.1',
    compatibilidad: '1.19.x',
    autor: 'Chocapic13',
    descargas: '18M+',
    imagen: '/images/recursos/chocapic.jpg',
    categoria: 'Versátil',
    fechaActualizacion: '2023-06-15',
    requisitos: 'Variable',
    valoracion: 4.5
  },
  {
    id: 'projectluma',
    nombre: 'Project LUMA',
    descripcion: 'Shaders ligeros con buen rendimiento y efectos visuales atractivos.',
    version: '1.5',
    compatibilidad: '1.19.x',
    autor: 'LegendaryJay',
    descargas: '5M+',
    imagen: '/images/recursos/projectluma.jpg',
    categoria: 'Ligero',
    fechaActualizacion: '2023-09-22',
    requisitos: 'Bajo',
    valoracion: 4.4
  }
]

// Categorías para filtrar
const categorias = ['Realista', 'Balanceado', 'Vibrante', 'Versátil', 'Ligero']

export default function ShadersPage() {
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
              Shaders para Minecraft
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Mejora la iluminación y los efectos visuales de tu juego con estos shaders
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
            {shaders.map(shader => (
              <Card key={shader.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="h-40 bg-accent/50 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-primary/60" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{shader.nombre}</CardTitle>
                    <Badge>{shader.categoria}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">v{shader.version}</span>
                    <span className="text-xs">Para MC {shader.compatibilidad}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{shader.descripcion}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{shader.autor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descargas:</span>
                      <p className="font-medium">{shader.descargas}</p>
                    </div>
                    <div className="flex items-center">
                      <Cpu className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Requisitos:</span>
                      <span className="font-medium">{shader.requisitos}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valoración:</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{shader.valoracion}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Link href={`/recursos/shaders/${shader.id}`} className="flex items-center justify-center w-full">
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
