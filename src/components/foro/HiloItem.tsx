import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserInitials } from '@/lib/utils/avatar-utils'
import { MessageSquare, Eye } from 'lucide-react'
import { Votacion } from '@/components/ui/Votacion'
import { useState, useEffect } from 'react'
import HiloCard from '@/components/foro/HiloCard'

export type HiloDTO = {
  id: string
  slug?: string | null
  titulo: string
  created_at: string
  vistas?: number | null
  respuestas_count?: number | null
  destacado?: boolean | null
  ultima_respuesta_at?: string | null
  subcategoria?: { id: string; nombre: string | null; slug: string | null; color?: string | null } | null
  autor?: { id: string; username: string | null; avatar_url?: string | null } | null
  media_preview_url?: string | null
  votos?: number | null
  contenido?: string | null
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'hace un momento'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'hace un momento'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getExcerpt(contenido?: string | null, maxLength: number = 100) {
  if (!contenido) return ''
  // Eliminar etiquetas HTML
  const plainText = contenido.replace(/<[^>]*>/g, '')
  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

export default function HiloItem({ hilo }: { hilo: HiloDTO }) {
  const href = hilo.slug ? `/foro/hilos/${hilo.slug}` : `/foro/hilos/${hilo.id}`

  return (
    <HiloCard
      id={hilo.id}
      href={href}
      titulo={hilo.titulo}
      contenido={hilo.contenido}
      categoriaNombre={hilo.subcategoria?.nombre || undefined}
      categoriaColor={hilo.subcategoria?.color || undefined}
      autorUsername={hilo.autor?.username || 'Anónimo'}
      autorAvatarUrl={hilo.autor?.avatar_url || null}
      createdAt={hilo.created_at}
      vistas={hilo.vistas ?? 0}
      respuestas={hilo.respuestas_count ?? 0}
      votosIniciales={hilo.votos ?? 0}
    />
  )
}
