'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealTimeIndicatorProps {
  isActive: boolean;
  lastUpdate: Date | null;
}

const RealTimeIndicator = memo(function RealTimeIndicator({
  isActive,
  lastUpdate,
}: RealTimeIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isActive ? 'default' : 'secondary'}
        className={`flex items-center gap-1 ${
          isActive ? 'animate-pulse' : ''
        }`}
      >
        {isActive ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>En tiempo real</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Desconectado</span>
          </>
        )}
      </Badge>
      
      {lastUpdate && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs">
            Actualizado {formatDistanceToNow(lastUpdate, { 
              addSuffix: true,
              locale: es 
            })}
          </span>
        </Badge>
      )}
    </div>
  );
});

export default RealTimeIndicator;
