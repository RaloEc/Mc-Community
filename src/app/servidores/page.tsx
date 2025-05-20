'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersIcon, ServerIcon, TagIcon, ExternalLinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Servidor } from '@/types'

// Datos de ejemplo para los servidores
/* const servidoresEjemplo = [
  {
    id: 1,
    nombre: 'SurvivalCraft',
    descripcion: 'Servidor de supervivencia con economía y protección de terrenos.',
    ip: 'survival.ejemplo.com',
    version: '1.19.2',
    jugadores: '120/500',
    tipo: 'Supervivencia',
    imagen: '/images/servers/survival.jpg',
    destacado: true
  },
  {
    id: 2,
    nombre: 'CreativeMC',
    descripcion: 'Servidor creativo con parcelas y herramientas de construcción avanzadas.',
    ip: 'creative.ejemplo.com',
    version: '1.19.2',
    jugadores: '85/200',
    tipo: 'Creativo',
    imagen: '/images/servers/creative.jpg',
    destacado: false
  },
  {
    id: 3,
    nombre: 'SkyBlock Network',
    descripcion: 'La mejor experiencia de SkyBlock con misiones y eventos semanales.',
    ip: 'skyblock.ejemplo.com',
    version: '1.19.2',
    jugadores: '210/1000',
    tipo: 'SkyBlock',
    imagen: '/images/servers/skyblock.jpg',
    destacado: true
  },
  {
    id: 4,
    nombre: 'PvP Legends',
    descripcion: 'Arena PvP con diferentes modos de juego y sistema de rangos.',
    ip: 'pvp.ejemplo.com',
    version: '1.19.2',
    jugadores: '150/300',
    tipo: 'PvP',
    imagen: '/images/servers/pvp.jpg',
    destacado: false
  },
  {
    id: 5,
    nombre: 'Pixelmon World',
    descripcion: 'Servidor de Pixelmon con gimnasios y eventos de captura.',
    ip: 'pixelmon.ejemplo.com',
    version: '1.16.5',
    jugadores: '95/200',
    tipo: 'Mods',
    imagen: '/images/servers/pixelmon.jpg',
    destacado: true
  },
  {
    id: 6,
    nombre: 'Factions Empire',
    descripcion: 'Servidor de facciones con guerras, economía y misiones.',
    ip: 'factions.ejemplo.com',
    version: '1.19.2',
    jugadores: '180/400',
    tipo: 'Factions',
    imagen: '/images/servers/factions.jpg',
    destacado: false
  }
]
 */

// Tipos de servidores para filtrar
const tiposServidores = ['Todos', 'Supervivencia', 'Creativo', 'SkyBlock', 'PvP', 'Mods', 'Factions']

export default function Servidores() {
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [cargando, setCargando] = useState(true)
  
  useEffect(() => {
    async function cargarServidores() {
      try {
        setCargando(true)
        
        let query = supabase
          .from('servidores')
          .select('*')
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error al cargar servidores:', error)
          return
        }
        
        setServidores(data || [])
      } catch (error) {
        console.error('Error al cargar servidores:', error)
      } finally {
        setCargando(false)
      }
    }
    
    cargarServidores()
  }, [])

  // Filtrar servidores por tipo y búsqueda
  const servidoresFiltrados = servidores.filter(servidor => 
    (filtroTipo === 'Todos' || servidor.tipo === filtroTipo) && 
    (servidor.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
     servidor.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      
      {/* Banner de la página */}
      <div className="bg-muted/40 dark:bg-amoled-gray py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Servidores de Minecraft
            </h1>
            <p className="text-xl text-muted-foreground">
              Encuentra los mejores servidores para jugar con amigos y la comunidad
            </p>
          </div>
        </div>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar servidores..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tiposServidores.map((tipo) => (
              <Button
                key={tipo}
                variant={filtroTipo === tipo ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroTipo(tipo)}
                className={filtroTipo === tipo ? "" : "hover:bg-accent"}
              >
                {tipo}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Lista de servidores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servidoresFiltrados.length > 0 ? (
            servidoresFiltrados.map((servidor) => (
              <Card 
                key={servidor.id}
                className={`overflow-hidden transition-all hover:shadow-md ${servidor.destacado ? 'border-primary' : ''}`}
              >
                <div className="h-40 bg-accent/50 relative flex items-center justify-center">
                  {servidor.destacado && (
                    <Badge className="absolute top-2 right-2 z-10">
                      Destacado
                    </Badge>
                  )}
                  <div className="text-4xl">
                    🎮
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{servidor.nombre}</CardTitle>
                  <CardDescription>{servidor.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                      <ServerIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Versión</p>
                        <p className="text-sm font-medium">{servidor.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jugadores</p>
                        <p className="text-sm font-medium">{servidor.jugadores}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">IP del servidor</p>
                      <p className="text-sm font-medium font-mono">{servidor.ip}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    {servidor.tipo}
                  </Badge>
                  <Button size="sm">
                    <ExternalLinkIcon className="h-4 w-4 mr-1" />
                    Conectar
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron servidores con estos criterios</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setFiltroTipo('Todos')
                  setBusqueda('')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección para agregar servidor */}
      <div className="bg-muted/40 dark:bg-amoled-gray py-16 mt-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Tienes un servidor de Minecraft?
            </h2>
            <p className="text-muted-foreground text-lg">
              Añade tu servidor a nuestra lista y llega a miles de jugadores. Promociona tu comunidad y aumenta tu base de jugadores.
            </p>
            <Button size="lg" className="mt-4">
              Agregar mi servidor
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
