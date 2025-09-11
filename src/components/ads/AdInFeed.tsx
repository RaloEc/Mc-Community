'use client';

import GoogleAdsense from './GoogleAdsense';

interface AdInFeedProps {
  className?: string;
  style?: React.CSSProperties;
  slotId?: string;
}

export default function AdInFeed({ 
  className = '', 
  style = {},
  slotId
}: AdInFeedProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const defaultSlotId = process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || slotId || '';
  
  if (!clientId || !defaultSlotId) {
    return (
      <div 
        className={`bg-muted/20 border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ minHeight: '250px', width: '100%', ...style }}
      >
        <p>Espacio reservado para anuncios in-feed</p>
      </div>
    );
  }

  return (
    <div className={`ad-infeed-container w-full ${className}`} style={style}>
      <GoogleAdsense
        client={clientId}
        slot={defaultSlotId}
        format="fluid"
        responsive={true}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          ...style
        }}
      />
    </div>
  );
}
