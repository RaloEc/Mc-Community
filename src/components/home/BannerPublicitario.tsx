'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BannerPublicitarioProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'square';
  closeable?: boolean;
}

export default function BannerPublicitario({ 
  className = '', 
  variant = 'horizontal',
  closeable = false 
}: BannerPublicitarioProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'horizontal':
        return 'h-24 md:h-32';
      case 'vertical':
        return 'h-64 w-48';
      case 'square':
        return 'h-48 w-48';
      default:
        return 'h-24 md:h-32';
    }
  };

  return (
    <div className={`relative ${getVariantClasses()} ${className}`}>
      <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl flex items-center justify-center overflow-hidden">
        {/* Contenido del banner */}
        <div className="text-center p-4">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            Espacio Publicitario
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {variant === 'horizontal' ? '728x90' : variant === 'vertical' ? '160x600' : '300x250'}
          </div>
        </div>

        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Botón de cerrar */}
        {closeable && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
