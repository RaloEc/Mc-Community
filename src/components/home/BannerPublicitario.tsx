'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdBanner from '@/components/ads/AdBanner';
import AdRectangle from '@/components/ads/AdRectangle';
import AdInFeed from '@/components/ads/AdInFeed';

interface BannerPublicitarioProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'square' | 'in-feed';
  closeable?: boolean;
  slotId?: string;
}

export default function BannerPublicitario({ 
  className = '', 
  variant = 'horizontal',
  closeable = false,
  slotId
}: BannerPublicitarioProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isVisible || !isClient) return null;

  // Si AdSense no está habilitado o no estamos en el cliente, mostrar placeholder
  const showPlaceholder = process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== 'true' || 
                         !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (showPlaceholder) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl flex items-center justify-center overflow-hidden">
          <div className="text-center p-4">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Espacio Publicitario
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {variant === 'horizontal' ? '728x90' : 
               variant === 'vertical' ? '160x600' : 
               variant === 'in-feed' ? 'In-Feed' : '300x250'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el anuncio correspondiente según el tipo
  return (
    <div className={`relative ${className}`}>
      {variant === 'horizontal' && (
        <AdBanner className="w-full" style={{ minHeight: '90px' }} />
      )}
      
      {variant === 'vertical' && (
        <AdRectangle className="h-[600px] w-[160px]" />
      )}
      
      {variant === 'square' && (
        <AdRectangle className="h-[250px] w-[300px]" />
      )}
      
      {variant === 'in-feed' && (
        <AdInFeed className="w-full" slotId={slotId} style={{ minHeight: '250px' }} />
      )}
      
      {closeable && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-foreground/60 hover:text-foreground hover:bg-background/80"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
