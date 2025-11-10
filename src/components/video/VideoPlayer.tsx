'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  className?: string
}

type VideoStatus = 'loading' | 'uploading' | 'processing' | 'completed' | 'failed'

interface VideoData {
  status: VideoStatus
  public_url: string | null
  error_message: string | null
}

export function VideoPlayer({ videoId, className = '' }: VideoPlayerProps) {
  const supabase = createClient()
  const [videoData, setVideoData] = useState<VideoData>({
    status: 'loading',
    public_url: null,
    error_message: null,
  })

  useEffect(() => {
    if (!videoId) return

    let isMounted = true

    const getInitialStatus = async () => {
      try {
        console.log(`[VideoPlayer] Obteniendo estado inicial para: ${videoId}`)
        const { data, error } = await supabase
          .from('videos')
          .select('status, public_url, error_message')
          .eq('id', videoId)
          .single()

        if (!isMounted) return

        if (error || !data) {
          console.error('[VideoPlayer] Error obteniendo datos:', error)
          setVideoData({
            status: 'failed',
            public_url: null,
            error_message: 'No se pudo obtener el estado del video',
          })
          return
        }

        console.log(`[VideoPlayer] Estado inicial: ${data.status}`)
        setVideoData({
          status: data.status as VideoStatus,
          public_url: data.public_url,
          error_message: data.error_message,
        })
      } catch (err) {
        if (!isMounted) return
        console.error('[VideoPlayer] Error:', err)
        setVideoData({
          status: 'failed',
          public_url: null,
          error_message: 'Error al obtener el estado del video',
        })
      }
    }

    getInitialStatus()

    // Suscribirse a cambios en Realtime
    console.log(`[VideoPlayer] Suscribiendo a cambios de: ${videoId}`)
    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          if (!isMounted) return

          const newVideo = payload.new as {
            status: string
            public_url: string | null
            error_message: string | null
          }

          console.log(`[VideoPlayer] Actualización recibida: ${newVideo.status}`)

          setVideoData({
            status: newVideo.status as VideoStatus,
            public_url: newVideo.public_url,
            error_message: newVideo.error_message,
          })
        }
      )
      .subscribe((status) => {
        console.log(`[VideoPlayer] Estado de suscripción: ${status}`)
      })

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [videoId, supabase])

  // Video completado
  if (videoData.status === 'completed' && videoData.public_url) {
    return (
      <video
        controls
        autoPlay
        muted
        loop
        playsInline
        src={videoData.public_url}
        className={`w-full rounded-lg bg-black ${className}`}
      >
        <source src={videoData.public_url} type="video/webm" />
        Tu navegador no soporta videos WebM.
      </video>
    )
  }

  // Error
  if (videoData.status === 'failed') {
    return (
      <div className={`flex items-center gap-3 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            Error al procesar el video
          </p>
          {videoData.error_message && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {videoData.error_message}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Procesando o cargando
  const statusText = {
    loading: 'Cargando...',
    uploading: 'Subiendo video...',
    processing: 'Procesando video...',
  }[videoData.status] || 'Procesando...'

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[200px] ${className}`}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {statusText}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        {videoData.status === 'uploading' && 'Esto puede tomar unos minutos...'}
        {videoData.status === 'processing' && 'Convirtiendo a WebM (VP9)...'}
      </span>
    </div>
  )
}
