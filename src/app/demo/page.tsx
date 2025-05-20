import NoticiasLista from '@/components/NoticiasLista';
import NoticiasGrid from '@/components/NoticiasGrid';
import NoticiasMiniatura from '@/components/NoticiasMiniatura';
import NoticiasDestacadas from '@/components/NoticiasDestacadas';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        {/* Título de la sección */}
        <div className="space-y-4 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Demostración de Componentes de Noticias
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Esta página muestra los diferentes componentes para visualizar noticias
          </p>
        </div>

        {/* Sección 1: NoticiasLista con 1 columna */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasLista (1 columna)</h2>
          <NoticiasLista limit={3} columnas={1} />
        </div>

        {/* Sección 2: NoticiasLista con 2 columnas */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasLista (2 columnas)</h2>
          <NoticiasLista limit={4} columnas={2} />
        </div>

        {/* Sección 3: NoticiasLista con 3 columnas */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasLista (3 columnas)</h2>
          <NoticiasLista limit={6} columnas={3} />
        </div>

        {/* Sección 4: NoticiasGrid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasGrid</h2>
          <NoticiasGrid limit={3} showTitle={false} />
        </div>

        {/* Sección 5: NoticiasMiniatura */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasMiniatura</h2>
          <div className="max-w-md mx-auto">
            <NoticiasMiniatura limit={3} />
          </div>
        </div>

        {/* Sección 6: NoticiasDestacadas */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">NoticiasDestacadas</h2>
          <NoticiasDestacadas />
        </div>
      </main>
    </div>
  );
}
