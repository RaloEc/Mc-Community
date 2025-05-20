'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Blocks, Palette, Sparkles } from 'lucide-react'

// Datos de ejemplo para los recursos
const recursos = {
  mods: [
    {
      id: 'create-mod',
      nombre: 'Create Mod',
      descripcion: 'Un mod que añade maquinaria y automatización con un estilo steampunk.',
      version: '0.5.1',
      compatibilidad: '1.19.2',
      autor: 'simibubi',
      descargas: '15M+',
      imagen: '/images/recursos/create-mod.jpg'
    },
    {
      id: 'jei',
      nombre: 'Just Enough Items (JEI)',
      descripcion: 'Muestra recetas y usos de todos los items del juego.',
      version: '11.5.0',
      compatibilidad: '1.19.2',
      autor: 'mezz',
      descargas: '50M+',
      imagen: '/images/recursos/jei.jpg'
    },
    {
      id: 'botania',
      nombre: 'Botania',
      descripcion: 'Mod de magia técnica basado en la naturaleza y las flores.',
      version: '1.19.2-437',
      compatibilidad: '1.19.2',
      autor: 'Vazkii',
      descargas: '20M+',
      imagen: '/images/recursos/botania.jpg'
    }
  ],
  texturas: [
    {
      id: 'faithful',
      nombre: 'Faithful 32x',
      descripcion: 'Una versión mejorada de las texturas vanilla con mayor resolución.',
      version: '1.19',
      compatibilidad: '1.19.x',
      autor: 'Faithful Team',
      descargas: '30M+',
      imagen: '/images/recursos/faithful.jpg'
    },
    {
      id: 'patrix',
      nombre: 'Patrix',
      descripcion: 'Pack de texturas realistas de alta resolución.',
      version: '1.19.2',
      compatibilidad: '1.19.2',
      autor: 'Patrix Team',
      descargas: '5M+',
      imagen: '/images/recursos/patrix.jpg'
    },
    {
      id: 'bare-bones',
      nombre: 'Bare Bones',
      descripcion: 'Texturas minimalistas inspiradas en el estilo de los trailers oficiales.',
      version: '1.19',
      compatibilidad: '1.19.x',
      autor: 'RobotPants',
      descargas: '8M+',
      imagen: '/images/recursos/bare-bones.jpg'
    }
  ],
  shaders: [
    {
      id: 'bsl',
      nombre: 'BSL Shaders',
      descripcion: 'Shaders con iluminación realista y efectos visuales avanzados.',
      version: '8.2.02',
      compatibilidad: '1.19.x',
      autor: 'Capt Tatsu',
      descargas: '10M+',
      imagen: '/images/recursos/bsl.jpg'
    },
    {
      id: 'seus',
      nombre: 'SEUS (Sonic Ether\'s Unbelievable Shaders)',
      descripcion: 'Uno de los packs de shaders más populares con efectos visuales impresionantes.',
      version: '11.0',
      compatibilidad: '1.19.x',
      autor: 'Sonic Ether',
      descargas: '25M+',
      imagen: '/images/recursos/seus.jpg'
    },
    {
      id: 'complementary',
      nombre: 'Complementary Shaders',
      descripcion: 'Shaders optimizados con gran calidad visual y rendimiento.',
      version: '4.6',
      compatibilidad: '1.19.x',
      autor: 'EminGT',
      descargas: '15M+',
      imagen: '/images/recursos/complementary.jpg'
    }
  ]
}

export default function RecursosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('mods')
  
  // Filtrar recursos basados en búsqueda
  const filteredResources = recursos[activeTab].filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Recursos para Minecraft
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Descubre los mejores mods, packs de texturas y shaders para mejorar tu experiencia de juego
            </p>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar recursos..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Tabs de categorías */}
          <Tabs defaultValue="mods" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="mods" className="flex items-center gap-2">
                  <Blocks className="h-4 w-4" />
                  <span>Mods</span>
                </TabsTrigger>
                <TabsTrigger value="texturas" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>Texturas</span>
                </TabsTrigger>
                <TabsTrigger value="shaders" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Shaders</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="mods" className="mt-0">
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map(mod => (
                    <ResourceCard 
                      key={mod.id}
                      resource={mod}
                      type="mods"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState setSearchTerm={setSearchTerm} />
              )}
            </TabsContent>
            
            <TabsContent value="texturas" className="mt-0">
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map(textura => (
                    <ResourceCard 
                      key={textura.id}
                      resource={textura}
                      type="texturas"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState setSearchTerm={setSearchTerm} />
              )}
            </TabsContent>
            
            <TabsContent value="shaders" className="mt-0">
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map(shader => (
                    <ResourceCard 
                      key={shader.id}
                      resource={shader}
                      type="shaders"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState setSearchTerm={setSearchTerm} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// Componente para la tarjeta de recurso
function ResourceCard({ resource, type }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="h-40 bg-accent/50 flex items-center justify-center">
        <div className="text-4xl">
          {type === 'mods' && <Blocks className="h-12 w-12 text-primary/60" />}
          {type === 'texturas' && <Palette className="h-12 w-12 text-primary/60" />}
          {type === 'shaders' && <Sparkles className="h-12 w-12 text-primary/60" />}
        </div>
      </div>
      <CardHeader>
        <CardTitle>{resource.nombre}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">v{resource.version}</span>
          <span className="text-xs">Para MC {resource.compatibilidad}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{resource.descripcion}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">Autor:</span>
            <p className="font-medium">{resource.autor}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Descargas:</span>
            <p className="font-medium">{resource.descargas}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/recursos/${type}/${resource.id}`}>
            Ver detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Componente para estado vacío
function EmptyState({ setSearchTerm }) {
  return (
    <div className="text-center py-12 space-y-4">
      <p className="text-xl text-muted-foreground">No se encontraron recursos que coincidan con tu búsqueda</p>
      <Button 
        variant="outline"
        onClick={() => setSearchTerm('')}
      >
        Mostrar todos los recursos
      </Button>
    </div>
  )
}
