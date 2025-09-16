'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, CalendarDays } from 'lucide-react';

interface IconMorphButtonProps {
  onClick: () => void;
  isActive: boolean;
  color?: string;
  className?: string;
}

export default function IconMorphButton({ onClick, isActive, color = '#3b82f6', className = '' }: IconMorphButtonProps) {
  // Usamos una animación CSS para la transición
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`p-2 rounded-full relative overflow-hidden ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: isActive ? `${color}20` : 'transparent',
        color: color,
      }}
    >
      <div className="relative w-5 h-5">
        {/* Icono de lista */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
          style={{
            opacity: isActive ? 0 : 1,
            transform: isActive ? 'rotate(-90deg) scale(0.5)' : 'rotate(0) scale(1)',
          }}
        >
          <List size={20} />
        </div>
        
        {/* Icono de calendario */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
          style={{
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.5)',
          }}
        >
          <CalendarDays size={20} />
        </div>
      </div>
    </Button>
  );
}
