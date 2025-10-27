"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import NextImage from "next/image";
import { Upload, X } from "lucide-react";

type FileWithPreview = File & {
  preview?: string;
};

interface ImageDropzoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isLoading?: boolean;
  className?: string;
  accept?: string;
  maxSize?: number; // En bytes
}

export function ImageDropzone({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isLoading = false,
  className,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Generar preview cuando se selecciona un archivo
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  const validateFile = useCallback(
    (file: File): string | null => {
      const allowedTypes = accept.split(",").map((type) => type.trim());
      if (!allowedTypes.includes(file.type)) {
        return "Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.";
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB.`;
      }

      return null;
    },
    [accept, maxSize]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (isLoading) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items || items.length === 0) {
        return;
      }

      const fileItem = Array.from(items).find(
        (item) => item.kind === "file" && item.type.startsWith("image/")
      );

      if (!fileItem) {
        return;
      }

      const file = fileItem.getAsFile();
      if (!file) {
        return;
      }

      event.preventDefault();
      handleFileSelect(file);
    },
    [handleFileSelect, isLoading]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full flex justify-center", className)}>
      <div className="w-full max-w-2xl">
        {!selectedFile ? (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200",
              "hover:border-[var(--user-color,#6366f1)] hover:bg-[var(--user-color,#6366f1)]/5",
              "dark:border-gray-600 dark:hover:border-[var(--user-color,#6366f1)]",
              isDragOver &&
                "border-[var(--user-color,#6366f1)] bg-[var(--user-color,#6366f1)]/10",
              isLoading && "pointer-events-none opacity-50"
            )}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
          >
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center text-center">
              <Upload
                className={cn(
                  "w-12 h-12 mb-4 transition-colors",
                  "text-gray-400 dark:text-gray-500",
                  isDragOver && "text-[var(--user-color,#6366f1)]"
                )}
              />

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isDragOver
                  ? "Suelta la imagen aquí"
                  : "Cargar imagen de estadísticas"}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Arrastra y suelta una imagen, haz clic para seleccionar o pega (Ctrl+V)
              </p>

              <div className="text-xs text-gray-400 dark:text-gray-500">
                <p>Formatos: JPEG, PNG, WebP</p>
                <p>Tamaño máximo: {Math.round(maxSize / (1024 * 1024))}MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <div className=" rounded-lg p-4 bg-gray-50 dark:bg-black">
              {/* Encabezado con nombre de archivo y botón de cerrar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <button
                  onClick={onFileRemove}
                  disabled={isLoading}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    "hover:bg-gray-200 dark:hover:bg-gray-700",
                    "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Vista previa de la imagen */}
              {preview && (
                <div className="relative w-full h-[50vh] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <NextImage
                    src={preview}
                    alt="Vista previa"
                    width={800}
                    height={500}
                    className="object-contain w-full h-full"
                    style={{
                      objectFit: "contain",
                    }}
                    unoptimized={preview.startsWith("blob:")}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
