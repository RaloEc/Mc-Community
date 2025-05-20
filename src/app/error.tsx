'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal</h2>
        <p className="text-gray-700 mb-6">
          Parece que ha ocurrido un error inesperado. 
          {error.message && ` Detalles: ${error.message}`}
        </p>
        <Button 
          onClick={() => reset()}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
