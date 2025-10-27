"use client";

import React, { useState, useCallback } from "react";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { WeaponStatsCard } from "./WeaponStatsCard";
import { useWeaponAnalyzer } from "@/hooks/useWeaponAnalyzer";
import { WeaponStats } from "@/app/api/analyze-weapon/route";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface WeaponStatsUploaderProps {
  onStatsExtracted?: (stats: WeaponStats) => void;
  onClose?: () => void;
  className?: string;
}

export function WeaponStatsUploader({
  onStatsExtracted,
  onClose,
  className,
}: WeaponStatsUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedStats, setExtractedStats] = useState<WeaponStats | null>(
    null
  );
  const [step, setStep] = useState<"upload" | "analyzing" | "results">(
    "upload"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { isAnalyzing, error, analyzeImage, clearError } = useWeaponAnalyzer();

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      clearError();

      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [clearError]
  );

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setExtractedStats(null);
    setImagePreview(null);
    setStep("upload");
    clearError();
  }, [clearError]);

  const handleUploadAnother = useCallback(() => {
    handleFileRemove();
  }, [handleFileRemove]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setStep("analyzing");
    const stats = await analyzeImage(selectedFile);

    if (stats) {
      setExtractedStats(stats);
      setStep("results");
    } else {
      setStep("upload");
    }
  }, [selectedFile, analyzeImage]);

  const handleRetry = useCallback(() => {
    clearError();
    handleAnalyze();
  }, [clearError, handleAnalyze]);

  const handleStatEdit = useCallback(
    (field: keyof WeaponStats, value: number | string) => {
      if (!extractedStats) return;

      setExtractedStats((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    [extractedStats]
  );

  const handleUseStats = useCallback(() => {
    if (extractedStats && onStatsExtracted) {
      onStatsExtracted(extractedStats);
    }
  }, [extractedStats, onStatsExtracted]);

  const generateStatsText = useCallback(() => {
    if (!extractedStats) return "";

    const statsText = `
**Estadísticas del Arma${
      extractedStats.nombreArma ? ` - ${extractedStats.nombreArma}` : ""
    }**

• **Daño:** ${extractedStats.dano}
• **Alcance:** ${extractedStats.alcance}m
• **Control:** ${extractedStats.control}
• **Manejo:** ${extractedStats.manejo}
• **Estabilidad:** ${extractedStats.estabilidad}
• **Precisión:** ${extractedStats.precision}
• **Perforación de blindaje:** ${extractedStats.perforacionBlindaje}
• **Cadencia de disparo:** ${extractedStats.cadenciaDisparo} dpm
• **Capacidad:** ${extractedStats.capacidad}
• **Velocidad de boca:** ${extractedStats.velocidadBoca} m/s
• **Sonido de disparo:** ${extractedStats.sonidoDisparo}m

*Estadísticas extraídas automáticamente usando IA*
    `.trim();

    return statsText;
  }, [extractedStats]);

  const handleCopyStats = useCallback(async () => {
    const statsText = generateStatsText();
    try {
      await navigator.clipboard.writeText(statsText);
      // Aquí podrías mostrar un toast de éxito
    } catch (err) {
      console.error("Error copiando al portapapeles:", err);
    }
  }, [generateStatsText]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Encabezado (oculto en resultados) */}
      {/* {step !== "upload" && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Análisis de Estadísticas de Arma
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sube una imagen de las estadísticas de un arma para extraer los
              datos automáticamente
            </p>
          </div>
        </div>
      )} */}

      {/* Área de carga y análisis */}
      {step === "upload" && (
        <div className="flex-1 flex flex-col gap-0 min-h-0">
          <ImageDropzone
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isLoading={isAnalyzing}
          />

          {/* Botón de análisis */}
          {selectedFile && (
            <div className="flex justify-center flex-shrink-0">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-[var(--user-color,#6366f1)] hover:bg-[var(--user-color,#6366f1)]/90 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizando imagen...
                  </>
                ) : (
                  "Analizar Estadísticas"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Estado de análisis */}
      {step === "analyzing" && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--user-color,#6366f1)]" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Analizando imagen...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Esto puede tomar unos segundos
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error en el análisis
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
          <div className="flex items-center sm:items-center gap-2 sm:ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUploadAnother}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-4 h-4 mr-1" />
              Subir otra
            </Button>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4" />
            </Button> */}
          </div>
        </div>
      )}

      {/* Resultados */}
      {step === "results" && extractedStats && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">
              Estadísticas extraídas exitosamente
            </span>
          </div>

          {/* Carrusel para móviles */}
          <div className="md:hidden mb-3">
            <Carousel className="w-full max-w-sm mx-auto">
              <CarouselContent>
                {imagePreview && (
                  <CarouselItem>
                    <div className="flex items-center justify-center p-2">
                      <div className="relative w-full aspect-[2/3] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Imagen del arma"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                )}
                <CarouselItem>
                  <div className="flex justify-center p-2">
                    <WeaponStatsCard
                      stats={extractedStats}
                      onEdit={handleStatEdit}
                      isEditable={true}
                      className="w-full max-w-[420px]"
                    />
                  </div>
                </CarouselItem>
              </CarouselContent>
              {imagePreview && (
                <>
                  <CarouselPrevious className="-left-4" />
                  <CarouselNext className="-right-4" />
                </>
              )}
            </Carousel>
          </div>

          {/* Diseño lado a lado en escritorio */}
          <div className="hidden md:flex justify-center gap-8 mb-3 w-full md:max-w-[1150px] mx-auto">
            {imagePreview && (
              // Contenedor 1: Imagen (mantiene su ancho original)
              <div className="flex-shrink-0 w-[380px] xl:w-[440px]">
                <div className="relative w-full aspect-[2/3] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Imagen del arma"
                    // Solución anterior: Usar object-cover para llenar el contenedor
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Contenedor 2: Stats - Aplicar el mismo ancho para coincidir */}
            <div className="flex-shrink-0 flex justify-center w-[380px] xl:w-[440px]">
              <WeaponStatsCard
                stats={extractedStats}
                onEdit={handleStatEdit}
                isEditable={true}
                // CAMBIO: Eliminar la clase de ancho en la tarjeta,
                // ahora el contenedor externo define el tamaño.
                className="w-full"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 justify-center pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              onClick={handleCopyStats}
              variant="outline"
              size="sm"
              className="border-[var(--user-color,#6366f1)] text-[var(--user-color,#6366f1)] hover:bg-[var(--user-color,#6366f1)]/10"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>

            {onStatsExtracted && (
              <Button
                onClick={handleUseStats}
                size="sm"
                className="bg-[var(--user-color,#6366f1)] hover:bg-[var(--user-color,#6366f1)]/90 text-white"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Usar
              </Button>
            )}

            <Button
              onClick={handleFileRemove}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Otra imagen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
