'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
// No es necesario importar Image de Next.js

interface ImageUploaderProps {
  currentImageUrl?: string;
  userId: string;
  onImageUploaded: (url: string) => void;
  className?: string;
}

export default function ImageUploader({
  currentImageUrl,
  userId,
  onImageUploaded,
  className = ''
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones básicas
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('La imagen es demasiado grande. El tamaño máximo es 2MB');
      return;
    }

    // Mostrar vista previa
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);

    // Subir la imagen
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir la imagen');
      }

      // Llamar al callback con la URL de la imagen
      onImageUploaded(result.data.url);
    } catch (err: any) {
      console.error('Error al subir la imagen:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-32 h-32 mx-auto">
          <img
            src={previewUrl}
            alt="Vista previa"
            className="w-full h-full object-cover rounded-full"
            crossOrigin="anonymous"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
            title="Eliminar imagen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? 'Cambiar imagen' : 'Subir imagen'}
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
