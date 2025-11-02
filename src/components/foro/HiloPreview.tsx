'use client'

import React from 'react'

/**
 * Extrae el primer párrafo del HTML
 */
const extractFirstParagraph = (html: string): string => {
  if (!html) return ''

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Buscar el primer párrafo (<p>)
  const firstP = tempDiv.querySelector('p')
  if (firstP) {
    return firstP.innerHTML
  }

  // Si no hay párrafo, buscar el primer texto no vacío
  const allText = tempDiv.innerText.trim()
  if (allText) {
    return `<p>${allText.split('\n')[0]}</p>`
  }

  return ''
}

/**
 * Extrae imágenes del HTML (excluyendo tweets)
 */
const extractImages = (html: string): string[] => {
  if (!html) return []

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Buscar todas las imágenes excepto las que estén dentro de tweets
  const allImages = Array.from(tempDiv.querySelectorAll('img'))
  const images = allImages
    .filter(img => !img.closest('[data-type="twitter-embed"]'))
    .map(img => {
      // Preferir data-fullsrc / data-original / data-src si existen
      const dataFull =
        img.getAttribute('data-fullsrc') ||
        img.getAttribute('data-full') ||
        img.getAttribute('data-original') ||
        img.getAttribute('data-src')
      if (dataFull) return dataFull

      // Fallback al src normal
      return img.getAttribute('src')
    })
    .filter((src): src is string => Boolean(src))

  return images
}

/**
 * Extrae el iframe de YouTube del HTML
 */
const extractYoutubeIframe = (html: string): string | null => {
  if (!html) return null

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const iframe = tempDiv.querySelector('iframe')
  if (!iframe) return null

  return iframe.getAttribute('src')
}

/**
 * Extrae el ID de video de YouTube de una URL
 */
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

interface HiloPreviewProps {
  html: string
  className?: string
}

/**
 * Componente que renderiza un preview del hilo:
 * - Primer párrafo del contenido
 * - Imágenes (máximo 1)
 * - Video de YouTube (si existe)
 * - Sin tweets
 */
export function HiloPreview({ html, className = '' }: HiloPreviewProps) {
  const firstParagraph = React.useMemo(() => extractFirstParagraph(html), [html])
  const images = React.useMemo(() => extractImages(html), [html])
  const youtubeUrl = React.useMemo(() => extractYoutubeIframe(html), [html])
  const youtubeVideoId = React.useMemo(
    () => (youtubeUrl ? getYoutubeVideoId(youtubeUrl) : null),
    [youtubeUrl]
  )

  return (
    <div className={className}>
      {/* Primer párrafo */}
      {firstParagraph && (
        <div
          className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: firstParagraph }}
        />
      )}

      {/* Video de YouTube */}
      {youtubeVideoId && (
        <div className="mb-3 relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* Primera imagen (si no hay video) */}
      {!youtubeVideoId && images.length > 0 && (
        <div className="mb-3 w-full flex justify-center">
          <div className="relative w-full h-[200px] rounded-lg overflow-hidden">
            <img
              src={images[0]}
              alt="Preview"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  )
}
