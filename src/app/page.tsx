import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Gamepad2, Globe, Newspaper, ChevronDown } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 dark:from-amoled-black dark:to-amoled-black">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('/minecraft-epic-landscape.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5">
              <span className="text-xs font-medium text-primary">Versión 1.20 Disponible</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Bienvenido a la <span className="text-primary">Comunidad</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              La comunidad de Minecraft más completa para jugadores competitivos, técnicos y casuales.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-white">Explorar</Button>
              <Button variant="outline" className="border-minecraft-diamond text-minecraft-diamond hover:bg-minecraft-diamond/10">
                Unirse
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Noticias Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md dark:bg-amoled-gray dark:border-blue-900/20 card-hover-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-minecraft-blue-500/5 to-minecraft-blue-700/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Últimas Noticias</h3>
              <p className="mb-4 text-muted-foreground">
                Mantente al día con las últimas actualizaciones, eventos y noticias del mundo de Minecraft.
              </p>
              <div className="mt-2 space-y-3">
                <div className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <p className="text-xs text-muted-foreground">12 Mayo, 2025</p>
                  <h4 className="font-medium">Minecraft 1.21: Todo lo que necesitas saber</h4>
                </div>
                <div className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <p className="text-xs text-muted-foreground">5 Mayo, 2025</p>
                  <h4 className="font-medium">Evento de verano: Construye tu paraíso tropical</h4>
                </div>
              </div>
              <Button variant="link" className="mt-4 px-0 text-primary">
                Ver todas las noticias →
              </Button>
            </div>

            {/* Servidores Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md dark:bg-amoled-gray dark:border-blue-900/20 card-hover-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-minecraft-blue-500/5 to-minecraft-blue-700/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Servidores</h3>
              <p className="mb-4 text-muted-foreground">
                Descubre los mejores servidores para jugar con amigos y la comunidad.
              </p>
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <div>
                    <h4 className="font-medium">SkyBlock Paradise</h4>
                    <p className="text-xs text-muted-foreground">120 jugadores online</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <div>
                    <h4 className="font-medium">Survival Games</h4>
                    <p className="text-xs text-muted-foreground">85 jugadores online</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
              </div>
              <Button variant="link" className="mt-4 px-0 text-primary">
                Ver todos los servidores →
              </Button>
            </div>

            {/* Recursos Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md dark:bg-amoled-gray dark:border-blue-900/20 card-hover-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-minecraft-blue-500/5 to-minecraft-blue-700/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Mods y Recursos</h3>
              <p className="mb-4 text-muted-foreground">
                Descubre los mejores mods y recursos para mejorar tu experiencia de juego.
              </p>
              <div className="mt-2 space-y-3">
                <div className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <h4 className="font-medium">Epic Adventure Mod</h4>
                  <p className="text-xs text-muted-foreground">Nuevas dimensiones y criaturas</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3 dark:bg-amoled-black/50">
                  <h4 className="font-medium">Medieval Texture Pack</h4>
                  <p className="text-xs text-muted-foreground">Transforma tu mundo en un reino medieval</p>
                </div>
              </div>
              <Button variant="link" className="mt-4 px-0 text-primary">
                Ver todos los recursos →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Wiki Section */}
      <section className="py-16 bg-muted/50 dark:bg-amoled-gray/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Wiki de Minecraft</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explora nuestra completa wiki con información detallada sobre bloques, ítems, mobs y más.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card dark:bg-amoled-black rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all dark:border-blue-900/20 card-hover-effect">
              <div className="p-4">
                <h3 className="font-medium mb-1">Bloques</h3>
                <p className="text-sm text-muted-foreground">Todos los bloques del juego</p>
              </div>
              <div className="bg-primary/5 px-4 py-2 border-t dark:border-blue-900/10">
                <p className="text-xs text-muted-foreground">+300 bloques documentados</p>
              </div>
            </div>
            <div className="bg-card dark:bg-amoled-black rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all dark:border-blue-900/20 card-hover-effect">
              <div className="p-4">
                <h3 className="font-medium mb-1">Ítems</h3>
                <p className="text-sm text-muted-foreground">Herramientas, armas y más</p>
              </div>
              <div className="bg-primary/5 px-4 py-2 border-t dark:border-blue-900/10">
                <p className="text-xs text-muted-foreground">+200 ítems documentados</p>
              </div>
            </div>
            <div className="bg-card dark:bg-amoled-black rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all dark:border-blue-900/20 card-hover-effect">
              <div className="p-4">
                <h3 className="font-medium mb-1">Mobs</h3>
                <p className="text-sm text-muted-foreground">Criaturas y enemigos</p>
              </div>
              <div className="bg-primary/5 px-4 py-2 border-t dark:border-blue-900/10">
                <p className="text-xs text-muted-foreground">+150 mobs documentados</p>
              </div>
            </div>
            <div className="bg-card dark:bg-amoled-black rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all dark:border-blue-900/20 card-hover-effect">
              <div className="p-4">
                <h3 className="font-medium mb-1">Guías</h3>
                <p className="text-sm text-muted-foreground">Tutoriales y consejos</p>
              </div>
              <div className="bg-primary/5 px-4 py-2 border-t dark:border-blue-900/10">
                <p className="text-xs text-muted-foreground">+50 guías detalladas</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              Explorar Wiki Completa
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-amoled-black dark:border-blue-900/20 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <path d="M14 11h4"></path>
                <path d="M14 15h4"></path>
                <path d="M11 15v-3.5a1.5 1.5 0 0 0-3 0V15"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              </svg>
              <p className="text-sm text-muted-foreground">
                © 2025 MC Community. Todos los derechos reservados.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Términos de Servicio
              </Link>
              <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
