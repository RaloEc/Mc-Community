'use client';

import GoogleAdsense from './GoogleAdsense';

interface AdBannerProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ className = '', style = {} }: AdBannerProps) {
  // Reemplaza estos valores con tu ID de cliente y slot de anuncio
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '';
  
  if (!clientId || !slotId) {
    // Si no hay IDs configurados, no renderizamos nada o mostramos un placeholder
    return (
      <div 
        className={`bg-muted/20 border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ minHeight: '90px', ...style }}
      >
        <p>Espacio reservado para anuncios</p>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <GoogleAdsense
        client={clientId}
        slot={slotId}
        format="auto"
        responsive={true}
        style={{ 
          display: 'block',
          minHeight: '90px',
          width: '100%',
          ...style
        }}
      />
    </div>
  );
}
