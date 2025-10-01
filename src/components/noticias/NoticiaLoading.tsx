'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NoticiaLoadingProps {
  error?: string | null;
}

export const NoticiaLoading: React.FC<NoticiaLoadingProps> = ({ error }) => {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
          <p className="mb-6">{error || "No se pudo cargar la noticia"}</p>
          <Button asChild>
            <Link href="/noticias">Volver a noticias</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground">Cargando noticia...</p>
      </div>
    </div>
  );
};

export const NoticiaErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Suspense fallback={<NoticiaLoading />}>
      {children}
    </React.Suspense>
  );
};

export default NoticiaLoading;
