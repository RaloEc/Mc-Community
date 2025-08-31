'use client';

import { useEffect } from 'react';
import Script from 'next/script';

// Declarar el tipo para window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdsenseProps {
  client: string;
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function GoogleAdsense({
  client,
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className = '',
}: GoogleAdsenseProps) {
  useEffect(() => {
    try {
      // Intentar forzar la carga de anuncios si window.adsbygoogle ya existe
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error al cargar el anuncio:', error);
    }
  }, []);

  return (
    <>
      <div className={`google-adsense ${className}`} style={style}>
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            ...style,
          }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </>
  );
}

// Componente para cargar el script de AdSense en el layout principal
export function GoogleAdsenseScript({ clientId }: { clientId: string }) {
  return (
    <>
      {/* Solo usar preconnect que es más apropiado y no genera advertencias */}
      <link 
        rel="preconnect" 
        href="https://pagead2.googlesyndication.com" 
        crossOrigin="anonymous" 
      />
      {/* Usar Script con afterInteractive para evitar problemas de hidratación */}
      <Script
        id="google-adsense"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
        suppressHydrationWarning
        onError={(e) => {
          console.error('Error al cargar el script de AdSense:', e);
        }}
      />
    </>
  );
}
