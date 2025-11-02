'use client'

import React, { useState, useEffect, useRef } from 'react'
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface TwitterEmbedComponentProps extends ReactNodeViewProps {}

const TwitterEmbedComponent: React.FC<TwitterEmbedComponentProps> = ({
  node,
  updateAttributes,
}) => {
  // Extraer datos del atributo twitterData
  const twitterData = node.attrs.twitterData || {};
  const url = twitterData.url;
  let html = twitterData.html;
  const authorName = twitterData.authorName;
  
  // Decodificar HTML si está en base64
  if (html && typeof html === 'string' && html.length > 0) {
    try {
      html = decodeURIComponent(escape(atob(html)));
    } catch (e) {
      console.error('Error decodificando HTML:', e);
    }
  }
  const [isLoading, setIsLoading] = useState(!html)
  const [error, setError] = useState<string | null>(null)
  const [tweetHtml, setTweetHtml] = useState(html || '')
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const widgetsProcessedRef = useRef(false)

  // Función para cargar el script de Twitter
  const loadTwitterScript = () => {
    if (scriptLoadedRef.current) return Promise.resolve()
    
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector('script[src*="platform.twitter.com"]')) {
        scriptLoadedRef.current = true
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.onload = () => {
        scriptLoadedRef.current = true
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load Twitter script'))
      document.head.appendChild(script)
    })
  }

  // Función para obtener el HTML del tweet
  const fetchTweetData = async () => {
    if (!url) return

    setIsLoading(true)
    setError(null)
    widgetsProcessedRef.current = false

    try {
      const response = await fetch(`/api/twitter/oembed?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tweet data')
      }

      const data = await response.json()
      
      setTweetHtml(data.html)
      
      // Codificar el HTML en base64 de forma segura para UTF-8
      let encodedHtml = null;
      if (data.html) {
        try {
          encodedHtml = btoa(unescape(encodeURIComponent(data.html)));
        } catch (e) {
          console.error('Error codificando HTML del tweet:', e);
        }
      }
      
      updateAttributes({ 
        twitterData: {
          url: url,
          html: encodedHtml,
          authorName: data.author_name,
        }
      })

      // Cargar el script de Twitter tras obtener el HTML
      await loadTwitterScript()

      // Procesar widgets con un pequeño delay para asegurar que el contenedor exista
      setTimeout(() => {
        if (
          window.twttr &&
          window.twttr.widgets &&
          containerRef.current &&
          !widgetsProcessedRef.current
        ) {
          window.twttr.widgets.load(containerRef.current)
          widgetsProcessedRef.current = true
        }
      }, 100)

    } catch (err) {
      console.error('Error fetching tweet:', err)
      setError('No se pudo cargar el tweet')
    } finally {
      setIsLoading(false)
    }
  }

  // Efecto para cargar el tweet al montar el componente
  useEffect(() => {
    if (!html && url) {
      fetchTweetData()
    } else if (html && !widgetsProcessedRef.current) {
      // Solo procesar widgets una vez
      loadTwitterScript().then(() => {
        if (window.twttr && window.twttr.widgets && containerRef.current) {
          window.twttr.widgets.load(containerRef.current)
          widgetsProcessedRef.current = true
        }
      })
    }
  }, [url, html])

  const handleRetry = () => {
    fetchTweetData()
  }

  if (isLoading) {
    return (
      <NodeViewWrapper className="twitter-embed-wrapper">
        <div className="twitter-embed-loading">
          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Cargando tweet...</span>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  if (error) {
    return (
      <NodeViewWrapper className="twitter-embed-wrapper">
        <div className="twitter-embed-error">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="twitter-embed-wrapper">
      <div 
        ref={containerRef}
        className="twitter-embed-content"
        dangerouslySetInnerHTML={{ __html: tweetHtml }}
        contentEditable={false}
      />
    </NodeViewWrapper>
  )
}

// Declarar el tipo para el objeto twttr de Twitter
declare global {
  interface Window {
    twttr: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>
      }
    }
  }
}

export default TwitterEmbedComponent
