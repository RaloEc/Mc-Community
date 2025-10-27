import { useState, useCallback } from 'react';
import { WeaponStats } from '@/app/api/analyze-weapon/route';

interface UseWeaponAnalyzerReturn {
  isAnalyzing: boolean;
  error: string | null;
  analyzeImage: (file: File) => Promise<WeaponStats | null>;
  clearError: () => void;
}

export function useWeaponAnalyzer(): UseWeaponAnalyzerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(async (file: File): Promise<WeaponStats | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Validar archivo antes de enviar
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('image', file);

      // Enviar a la API
      const response = await fetch('/api/analyze-weapon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const friendlyError =
          typeof errorData.error === 'string' && errorData.error.length > 0
            ? errorData.error
            : `Error ${response.status}: ${response.statusText}`;
        throw new Error(friendlyError);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('No se pudieron extraer las estadísticas de la imagen');
      }

      return result.data as WeaponStats;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAnalyzing,
    error,
    analyzeImage,
    clearError,
  };
}
