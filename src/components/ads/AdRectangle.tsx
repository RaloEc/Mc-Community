'use client';

import GoogleAdsense from './GoogleAdsense';

interface AdRectangleProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AdRectangle({ className = '', style = {} }: AdRectangleProps) {
  // Reemplaza estos valores con tu ID de cliente y slot de anuncio
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT || '';
  
  if (!clientId || !slotId) {
    // Si no hay IDs configurados, mostramos un placeholder
    return (
      <div 
        className={`bg-muted/20 border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ minHeight: '250px', minWidth: '300px', ...style }}
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
        format="rectangle"
        responsive={false}
        style={{ 
          display: 'block',
          minHeight: '250px',
          minWidth: '300px',
          ...style
        }}
      />
    </div>
  );
}
