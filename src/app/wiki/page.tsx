'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '../../components/Header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Tag, Layers, Package } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Datos de ejemplo para los items de Minecraft
const itemsData = [
  {
    id: 'diamond',
    name: 'Diamante',
    description: 'Un mineral valioso que se encuentra en las profundidades. Se usa para crear herramientas y armaduras duraderas.',
    image: '/images/items/diamond.png',
    category: 'mineral',
    properties: {
      durabilidad: 'N/A',
      stackeable: 'Sí (64)',
      obtencion: 'Minando vetas de diamante entre Y=-63 y Y=16'
    }
  },
  {
    id: 'iron_ingot',
    name: 'Lingote de Hierro',
    description: 'Material básico para la creación de herramientas, armaduras y otros objetos.',
    image: '/images/items/iron_ingot.png',
    category: 'mineral',
    properties: {
      durabilidad: 'N/A',
      stackeable: 'Sí (64)',
      obtencion: 'Fundiendo mineral de hierro'
    }
  },
  {
    id: 'netherite_ingot',
    name: 'Lingote de Netherita',
    description: 'El material más resistente del juego, usado para mejorar herramientas y armaduras de diamante.',
    image: '/images/items/netherite_ingot.png',
    category: 'mineral',
    properties: {
      durabilidad: 'N/A',
      stackeable: 'Sí (64)',
      obtencion: 'Combinando 4 restos antiguos con 4 lingotes de oro'
    }
  },
  {
    id: 'ender_pearl',
    name: 'Perla de Ender',
    description: 'Objeto que permite teletransportarse a corta distancia. También se usa para crear ojos de ender.',
    image: '/images/items/ender_pearl.png',
    category: 'misceláneo',
    properties: {
      durabilidad: 'N/A',
      stackeable: 'Sí (16)',
      obtencion: 'Derrotando endermans'
    }
  },
  {
    id: 'golden_apple',
    name: 'Manzana Dorada',
    description: 'Alimento que otorga regeneración y absorción al consumirlo.',
    image: '/images/items/golden_apple.png',
    category: 'alimento',
    properties: {
      durabilidad: 'N/A',
      stackeable: 'Sí (64)',
      obtencion: 'Crafteo con 8 lingotes de oro y 1 manzana'
    }
  },
  {
    id: 'elytra',
    name: 'Élitros',
    description: 'Alas que permiten planear y volar cuando se usan con cohetes de fuegos artificiales.',
    image: '/images/items/elytra.png',
    category: 'equipamiento',
    properties: {
      durabilidad: '432',
      stackeable: 'No',
      obtencion: 'En barcos del End'
    }
  }
]

export default function WikiPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  
  // Filtrar items basados en búsqueda y categoría
  const filteredItems = itemsData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const categories = [
    { id: 'todos', name: 'Todos' },
    { id: 'mineral', name: 'Minerales' },
    { id: 'alimento', name: 'Alimentos' },
    { id: 'equipamiento', name: 'Equipamiento' },
    { id: 'misceláneo', name: 'Misceláneo' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Wiki de Minecraft
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explora información detallada sobre los items del juego
            </p>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar items..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:w-64">
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Grid de items */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent/50 rounded-md flex items-center justify-center border">
                        <div className="w-8 h-8 text-primary">
                          {item.category === 'mineral' && <Package className="h-8 w-8" />}
                          {item.category === 'alimento' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M18 8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v12h16V8z"/><path d="M18 8c0 4-4 8-4 8H6c0-4 4-8 4-8"/><path d="M10 8v12"/><path d="M14 8v12"/></svg>}
                          {item.category === 'equipamiento' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M14.5 22H18a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h3.5"/><path d="M14 2v6h6"/><path d="M16 13h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H12"/><path d="M12 19v-6"/></svg>}
                          {item.category === 'misceláneo' && <Layers className="h-8 w-8" />}
                        </div>
                      </div>
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          <Tag className="h-3 w-3 mr-1" />
                          <span className="capitalize">{item.category}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{item.description}</CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stackeable:</span>
                        <span className="font-medium">{item.properties.stackeable}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durabilidad:</span>
                        <span className="font-medium">{item.properties.durabilidad}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/wiki/${item.id}`}>
                        Ver detalles
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-xl text-muted-foreground">No se encontraron items que coincidan con tu búsqueda</p>
              <Button 
                variant="outline"
                onClick={() => {setSearchTerm(''); setSelectedCategory('todos')}}
              >
                Mostrar todos los items
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
