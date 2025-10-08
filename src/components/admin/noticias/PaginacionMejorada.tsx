import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginacionMejoradaProps {
  paginaActual: number
  totalPaginas: number
  elementosPorPagina: number
  totalElementos: number
  onCambiarPagina: (pagina: number) => void
  onCambiarElementosPorPagina: (elementos: number) => void
}

export function PaginacionMejorada({
  paginaActual,
  totalPaginas,
  elementosPorPagina,
  totalElementos,
  onCambiarPagina,
  onCambiarElementosPorPagina,
}: PaginacionMejoradaProps) {
  const [paginaInput, setPaginaInput] = React.useState(paginaActual.toString())

  React.useEffect(() => {
    setPaginaInput(paginaActual.toString())
  }, [paginaActual])

  const irAPagina = () => {
    const pagina = parseInt(paginaInput)
    if (!isNaN(pagina) && pagina >= 1 && pagina <= totalPaginas) {
      onCambiarPagina(pagina)
    } else {
      setPaginaInput(paginaActual.toString())
    }
  }

  const generarNumerosPagina = () => {
    const paginas: (number | string)[] = []
    const rango = 2 // Páginas a mostrar a cada lado de la actual

    if (totalPaginas <= 7) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i)
      }
    } else {
      // Siempre mostrar primera página
      paginas.push(1)

      if (paginaActual > rango + 2) {
        paginas.push('...')
      }

      // Páginas alrededor de la actual
      const inicio = Math.max(2, paginaActual - rango)
      const fin = Math.min(totalPaginas - 1, paginaActual + rango)

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i)
      }

      if (paginaActual < totalPaginas - rango - 1) {
        paginas.push('...')
      }

      // Siempre mostrar última página
      paginas.push(totalPaginas)
    }

    return paginas
  }

  const desde = (paginaActual - 1) * elementosPorPagina + 1
  const hasta = Math.min(paginaActual * elementosPorPagina, totalElementos)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Mostrando {desde} - {hasta} de {totalElementos}
        </span>
        <Select
          value={elementosPorPagina.toString()}
          onValueChange={(value) => onCambiarElementosPorPagina(parseInt(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / página</SelectItem>
            <SelectItem value="25">25 / página</SelectItem>
            <SelectItem value="50">50 / página</SelectItem>
            <SelectItem value="100">100 / página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambiarPagina(1)}
          disabled={paginaActual === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {generarNumerosPagina().map((pagina, index) => (
            <React.Fragment key={index}>
              {pagina === '...' ? (
                <span className="px-2">...</span>
              ) : (
                <Button
                  variant={paginaActual === pagina ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCambiarPagina(pagina as number)}
                  className="min-w-[40px]"
                >
                  {pagina}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <Input
            type="number"
            value={paginaInput}
            onChange={(e) => setPaginaInput(e.target.value)}
            onBlur={irAPagina}
            onKeyDown={(e) => e.key === 'Enter' && irAPagina()}
            className="w-16 text-center"
            min={1}
            max={totalPaginas}
          />
          <span className="text-sm text-muted-foreground">/ {totalPaginas}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambiarPagina(totalPaginas)}
          disabled={paginaActual === totalPaginas}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
