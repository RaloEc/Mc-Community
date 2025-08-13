'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Servidor, SolicitudServidor } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ArrowUpDown, 
  Server, 
  User, 
  Tag,
  Check,
  X,
  Clock
} from 'lucide-react'
import AdminProtection from '@/components/AdminProtection'

// Servidores de ejemplo para mostrar mientras se cargan los datos reales
const servidoresEjemplo: Servidor[] = [
  {
    id: 1,
    nombre: 'Survival Premium',
    descripcion: 'Servidor de supervivencia con economía y protección de terrenos',
    ip: 'survival.ejemplo.com',
    version: '1.20.1',
    jugadores: '120/200',
    tipo: 'Survival',
    imagen: '/images/servers/survival.jpg',
    destacado: true
  },
  {
    id: 2,
    nombre: 'Creative World',
    descripcion: 'Servidor creativo con WorldEdit y VoxelSniper',
    ip: 'creative.ejemplo.com',
    version: '1.19.4',
    jugadores: '45/100',
    tipo: 'Creativo',
    imagen: '/images/servers/creative.jpg',
    destacado: false
  },
  {
    id: 3,
    nombre: 'SkyBlock Adventures',
    descripcion: 'Servidor de SkyBlock con misiones y eventos semanales',
    ip: 'skyblock.ejemplo.com',
    version: '1.20',
    jugadores: '78/150',
    tipo: 'SkyBlock',
    imagen: '/images/servers/skyblock.jpg',
    destacado: true
  }
]

function AdminServidoresContent() {
  const router = useRouter()
  const supabase = createClient()
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [solicitudesServidores, setSolicitudesServidores] = useState<SolicitudServidor[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [ordenNombre, setOrdenNombre] = useState<'asc' | 'desc'>('asc')
  const [servidorSeleccionado, setServidorSeleccionado] = useState<Servidor | null>(null)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudServidor | null>(null)
  const [tabActiva, setTabActiva] = useState('aprobados')

  // Efecto para la carga inicial
  useEffect(() => {
    cargarServidores()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Efecto para manejar cambios en filtros
  useEffect(() => {
    // Solo aplicamos filtros locales, no recargamos datos
  }, [ordenNombre, busqueda, tabActiva])

  async function cargarServidores() {
    try {
      setCargando(true)
      
      // Cargar servidores aprobados
      const { data: servidoresData, error: servidoresError } = await supabase
        .from('servidores')
        .select('*')
        .order('nombre', { ascending: ordenNombre === 'asc' })
      
      if (servidoresError) {
        console.error('Error al cargar servidores:', servidoresError)
      } else {
        setServidores(servidoresData || [])
      }
      
      // Cargar solicitudes de servidores pendientes
      // No ordenamos por nombre ya que la columna podría no existir
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes_servidores')
        .select('*')
        // Ordenamos por id o created_at para evitar errores
        .order('id', { ascending: true })
      
      if (solicitudesError) {
        console.error('Error al cargar solicitudes de servidores:', solicitudesError)
      } else {
        // Verificar la estructura de los datos recibidos
        console.log('Estructura de solicitudes_servidores:', solicitudesData ? Object.keys(solicitudesData[0] || {}) : 'No hay datos');
        console.log('Datos completos de solicitudes:', JSON.stringify(solicitudesData, null, 2));
        
        // Si necesitamos ordenar por nombre, lo hacemos en memoria
        const solicitudesOrdenadas = solicitudesData || [];
        if (solicitudesOrdenadas.length > 0 && 'nombre' in solicitudesOrdenadas[0]) {
          // Solo ordenamos si la propiedad existe en los datos
          solicitudesOrdenadas.sort((a, b) => {
            if (ordenNombre === 'asc') {
              return a.nombre.localeCompare(b.nombre);
            } else {
              return b.nombre.localeCompare(a.nombre);
            }
          });
        }
        setSolicitudesServidores(solicitudesOrdenadas)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      // Inicializar con arrays vacíos en caso de error
      setServidores([])
      setSolicitudesServidores([])
    } finally {
      setCargando(false)
    }
  }

  async function eliminarServidor(id: number) {
    try {
      if (!id) {
        console.error('ID de servidor inválido')
        return
      }

      const { error } = await supabase
        .from('servidores')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error al eliminar servidor:', error)
        alert('Error al eliminar el servidor')
        return
      }
      
      // Actualizar la lista de servidores usando el patrón funcional
      setServidores(servidoresActuales => 
        servidoresActuales.filter(servidor => servidor.id !== id)
      )

      // Mostrar mensaje de éxito
      alert('Servidor eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar servidor:', error)
      alert('Error al eliminar el servidor')
    }
  }

  async function aprobarSolicitud(solicitud: SolicitudServidor) {
    try {
      if (!solicitud || !solicitud.id) {
        console.error('Solicitud inválida')
        return
      }

      // Llamar a la API Route para aprobar la solicitud
      const response = await fetch('/api/servidores/aprobar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: solicitud.id }),
      });

      const resultado = await response.json();
      
      if (!response.ok) {
        console.error('Error al aprobar solicitud:', resultado.error, resultado.details)
        alert('Error al aprobar la solicitud: ' + (resultado.error || 'Error desconocido'))
        return
      }
      
      // Actualizar las listas
      if (resultado.servidor) {
        setServidores(servidoresActuales => [...servidoresActuales, resultado.servidor])
      }
      setSolicitudesServidores(solicitudesActuales => 
        solicitudesActuales.filter(s => s.id !== solicitud.id)
      )

      // Mostrar mensaje de éxito
      alert('Servidor aprobado correctamente')
    } catch (error) {
      console.error('Error al aprobar solicitud:', error)
      alert('Error al aprobar la solicitud')
    }
  }

  async function rechazarSolicitud(id: string) {
    try {
      if (!id) {
        console.error('ID de solicitud inválido')
        return
      }

      // Llamar a la API Route para rechazar la solicitud
      const response = await fetch('/api/servidores/rechazar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const resultado = await response.json();
      
      if (!response.ok) {
        console.error('Error al rechazar solicitud:', resultado.error, resultado.details)
        alert('Error al rechazar la solicitud: ' + (resultado.error || 'Error desconocido'))
        return
      }
      
      // Actualizar la lista de solicitudes usando el patrón funcional
      setSolicitudesServidores(solicitudesActuales => 
        solicitudesActuales.filter(solicitud => solicitud.id !== id)
      )

      // Mostrar mensaje de éxito
      alert('Solicitud rechazada correctamente')
    } catch (error) {
      console.error('Error al rechazar solicitud:', error)
      alert('Error al rechazar la solicitud')
    }
  }

  // Filtrar servidores según la búsqueda
  const servidoresFiltrados = servidores.filter(servidor => 
    servidor && (
      (servidor.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (servidor.tipo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (servidor.ip || '').toLowerCase().includes(busqueda.toLowerCase())
    )
  )

  // Truncar texto para descripciones largas
  function truncarTexto(texto: string | undefined | null, longitud: number) {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Administrar Servidores</h1>
        <Button onClick={() => router.push('/admin/servidores/crear')}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servidor
        </Button>
      </div>
      
      <Tabs defaultValue="aprobados" value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aprobados" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Servidores Aprobados
            {servidores.length > 0 && (
              <Badge variant="secondary" className="ml-2">{servidores.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes de Aprobación
            {solicitudesServidores.length > 0 && (
              <Badge variant="destructive" className="ml-2">{solicitudesServidores.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="aprobados">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Servidores Aprobados</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, tipo o IP..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cargando ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : servidoresFiltrados.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
                          <Button 
                            variant="ghost" 
                            onClick={() => setOrdenNombre(ordenNombre === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-1"
                          >
                            Nombre
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                        <TableHead className="hidden md:table-cell">IP</TableHead>
                        <TableHead className="hidden md:table-cell">Versión</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden md:table-cell">Destacado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servidoresFiltrados.map((servidor) => (
                        <TableRow key={servidor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded overflow-hidden bg-secondary">
                                <img 
                                  src={servidor.imagen || `https://eu.mc-api.net/v3/server/favicon/${servidor.ip}`} 
                                  alt={servidor.nombre} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Si falla la carga, usar un gradiente como fallback
                                    (e.target as HTMLImageElement).style.background = 'linear-gradient(45deg, #2563eb, #4f46e5)'
                                  }}
                                />
                              </div>
                              <span>{servidor.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {truncarTexto(servidor.descripcion, 50)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">
                            {servidor.ip}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {servidor.version}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{servidor.tipo}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {servidor.destacado ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600">Destacado</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/admin/servidores/editar/${servidor.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setServidorSeleccionado(servidor)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No se encontraron servidores</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                  >
                    Actualizar
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Total: {servidores.length} servidores
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => cargarServidores()}
                >
                  Actualizar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="pendientes">
          <Card className="border-border/40 dark:bg-black">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Solicitudes de Servidores Pendientes</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar..."
                      className="w-[200px] pl-8"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cargando ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : solicitudesServidores.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Nombre</TableHead>
                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                        <TableHead className="hidden md:table-cell">IP</TableHead>
                        <TableHead className="hidden md:table-cell">Versión</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudesServidores.map((solicitud) => (
                        <TableRow key={solicitud.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded overflow-hidden bg-secondary">
                                <img 
                                  src={solicitud.url_imagen_logo || `https://eu.mc-api.net/v3/server/favicon/${solicitud.ip_servidor}`} 
                                  alt={solicitud.nombre_servidor || 'Servidor'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Si falla la carga, usar un gradiente como fallback
                                    (e.target as HTMLImageElement).style.background = 'linear-gradient(45deg, #2563eb, #4f46e5)'
                                  }}
                                />
                              </div>
                              <span>{solicitud.nombre_servidor}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {truncarTexto(solicitud.descripcion_solicitud || '-', 50)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">
                            {solicitud.ip_servidor}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {solicitud.version_preferida || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{solicitud.tipo_juego}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                onClick={() => aprobarSolicitud(solicitud)}
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Aprobar</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => setSolicitudSeleccionada(solicitud)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Rechazar</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/admin/servidores/editar/${solicitud.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No hay solicitudes de servidores pendientes</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Total: {solicitudesServidores.length} solicitudes pendientes
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => cargarServidores()}
                >
                  Actualizar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar servidor */}
      <AlertDialog open={!!servidorSeleccionado} onOpenChange={(open) => !open && setServidorSeleccionado(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el servidor <span className="font-semibold">{servidorSeleccionado?.nombre}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (servidorSeleccionado) {
                  eliminarServidor(servidorSeleccionado.id)
                  setServidorSeleccionado(null)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmación para rechazar solicitud */}
      <AlertDialog open={!!solicitudSeleccionada} onOpenChange={(open) => !open && setSolicitudSeleccionada(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se rechazará y eliminará permanentemente la solicitud del servidor <span className="font-semibold">{solicitudSeleccionada?.nombre_servidor}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (solicitudSeleccionada) {
                  rechazarSolicitud(solicitudSeleccionada.id)
                  setSolicitudSeleccionada(null)
                }
              }}
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminServidores() {
  return (
    <AdminProtection>
      <AdminServidoresContent />
    </AdminProtection>
  )
}
