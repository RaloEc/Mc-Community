import Header from '../../components/Header'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Noticias() {
  // Datos de ejemplo para las noticias
  const noticias = [
    {
      id: 1,
      titulo: 'Nueva Actualización 1.21',
      fecha: '2025-04-03',
      imagen: 'https://placehold.co/600x400/1a1a1a/44bd32?text=Minecraft+Update',
      resumen: 'Descubre todas las novedades que trae la última actualización de Minecraft',
      categoria: 'Actualizaciones'
    },
    {
      id: 2,
      titulo: 'Torneo PvP Internacional',
      fecha: '2025-04-02',
      imagen: 'https://placehold.co/600x400/1a1a1a/44bd32?text=Minecraft+PvP',
      resumen: 'El mayor torneo de PvP del año está por comenzar. ¡Inscríbete ahora!',
      categoria: 'Eventos'
    },
    {
      id: 3,
      titulo: 'Nuevo Pack de Texturas',
      fecha: '2025-04-01',
      imagen: 'https://placehold.co/600x400/1a1a1a/44bd32?text=Minecraft+Textures',
      resumen: 'Realismo extremo: El pack de texturas que revolucionará tu experiencia',
      categoria: 'Recursos'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Título de la sección */}
        <div className="space-y-4 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Últimas Noticias
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mantente al día con las últimas novedades del mundo de Minecraft
          </p>
        </div>

        {/* Grid de noticias */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map((noticia) => (
            <article 
              key={noticia.id}
              className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-blue-900/20 dark:bg-amoled-gray"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <Image
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge 
                  className="absolute top-4 right-4 z-20"
                  variant="secondary"
                >
                  {noticia.categoria}
                </Badge>
              </div>
              
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <time>
                    {new Date(noticia.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
                <h2 className="text-xl font-semibold leading-none tracking-tight mt-2">
                  {noticia.titulo}
                </h2>
                <p className="text-muted-foreground">
                  {noticia.resumen}
                </p>
                <div className="pt-4 mt-auto">
                  <Button 
                    variant="link" 
                    className="px-0 text-primary" 
                    asChild
                  >
                    <Link href={`/noticias/${noticia.id}`}>
                      Leer más
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
