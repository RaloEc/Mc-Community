import HiloItem, { HiloDTO } from './HiloItem'

export type { HiloDTO } from './HiloItem'

export default function HilosLista({ hilos, loading }: { hilos: HiloDTO[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    )
  }
  if (!hilos || hilos.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        No hay hilos que coincidan con tu búsqueda.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {hilos.map(h => (
        <HiloItem key={h.id} hilo={h} />
      ))}
    </div>
  )
}
