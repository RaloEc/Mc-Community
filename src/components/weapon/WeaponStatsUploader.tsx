"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Nuevo hook con polling
  const { status, error, stats, startAnalysis, clear } = useWeaponAnalyzer();

  // Derivar el estado de la UI del estado del hook
  const isAnalyzing = status === "uploading" || status === "analyzing";
  const step =
    status === "success"
      ? "results"
      : isAnalyzing
      ? "analyzing"
      : "upload";

  const handleFileSelect = useCallback(
    (file: File) => {
      console.log("[WeaponStatsUploader] Archivo seleccionado", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setSelectedFile(file);
      clear();

      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [clear]
  );

  const handleFileRemove = useCallback(() => {
    console.log("[WeaponStatsUploader] Reiniciando selección de archivo");
    setSelectedFile(null);
    setImagePreview(null);
    clear();
  }, [clear]);

  const handleUploadAnother = useCallback(() => {
    console.log("[WeaponStatsUploader] Solicitud de subir otra imagen");
    handleFileRemove();
  }, [handleFileRemove]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    console.log("[WeaponStatsUploader] Iniciando análisis desde el modal", {
      fileName: selectedFile.name,
    });
    await startAnalysis(selectedFile);
  }, [selectedFile, startAnalysis]);

  const handleRetry = useCallback(() => {
    console.log("[WeaponStatsUploader] Reintentando análisis");
    clear();
    handleAnalyze();
  }, [clear, handleAnalyze]);

  const handleStatEdit = useCallback(
    (field: keyof WeaponStats, value: number | string) => {
      // Las stats del hook son de solo lectura (vienen de Gemini)
      // Si necesitas edición, copia stats a estado local después de success
    },
    []
  );

  const handleUseStats = useCallback(() => {
    if (stats && onStatsExtracted) {
      console.log("[WeaponStatsUploader] Estadísticas aceptadas por el usuario", {
        stats,
      });
      onStatsExtracted(stats);
    }
  }, [stats, onStatsExtracted]);

  const normalizeStats = useCallback((rawStats: WeaponStats): WeaponStats => {
    const normalized: any = { ...rawStats };
    
    // Mapeo de español a inglés
    const spanishToEnglish: Record<string, string> = {
      dano: "damage",
      alcance: "range",
      manejo: "handling",
      estabilidad: "stability",
      precision: "accuracy",
      perforacionBlindaje: "armorPenetration",
      cadenciaDisparo: "fireRate",
      velocidadBoca: "muzzleVelocity",
      sonidoDisparo: "soundRange",
      capacidad: "capacity",
    };
    
    // Copiar valores de campos en español a sus equivalentes en inglés
    Object.entries(spanishToEnglish).forEach(([spanish, english]) => {
      if (spanish in rawStats && !(english in rawStats)) {
        normalized[english] = rawStats[spanish as keyof WeaponStats];
      }
    });
    
    return normalized;
  }, []);

  const generateStatsText = useCallback(() => {
    if (!stats) return "";

    const normalizedStats = normalizeStats(stats);

    const statsText = `
**Estadísticas del Arma${
      normalizedStats.nombreArma ? ` - ${normalizedStats.nombreArma}` : ""
    }**

• **Daño:** ${normalizedStats.damage ?? "N/A"}
• **Alcance:** ${normalizedStats.range ?? "N/A"}m
• **Control:** ${normalizedStats.control ?? "N/A"}
• **Manejo:** ${normalizedStats.handling ?? "N/A"}
• **Estabilidad:** ${normalizedStats.stability ?? "N/A"}
• **Precisión:** ${normalizedStats.accuracy ?? "N/A"}
• **Perforación de blindaje:** ${normalizedStats.armorPenetration ?? "N/A"}
• **Cadencia de disparo:** ${normalizedStats.fireRate ?? "N/A"} dpm
• **Capacidad:** ${normalizedStats.capacity ?? "N/A"}
• **Velocidad de boca:** ${normalizedStats.muzzleVelocity ?? "N/A"} m/s
• **Sonido de disparo:** ${normalizedStats.soundRange ?? "N/A"}m

*Estadísticas extraídas automáticamente usando IA*
    `.trim();

    return statsText;
  }, [stats, normalizeStats]);

  const handleCopyStats = useCallback(async () => {
    const statsText = generateStatsText();
    console.log("[WeaponStatsUploader] Copiando estadísticas al portapapeles", {
      hasStats: Boolean(stats),
    });
    try {
      await navigator.clipboard.writeText(statsText);
      // Aquí podrías mostrar un toast de éxito
    } catch (err) {
      console.error("Error copiando al portapapeles:", err);
    }
  }, [generateStatsText, stats]);

  useEffect(() => {
    console.log("[WeaponStatsUploader] Estado de análisis actualizado", {
      status,
      step,
      hasStats: Boolean(stats),
      hasError: Boolean(error),
    });
  }, [status, step, stats, error]);

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
              {status === "uploading"
                ? "Subiendo imagen..."
                : "Analizando imagen..."}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Esto puede tomar unos segundos
            </p>
          </div>
        </div>
      )}

      {/* Error - Mostrar en modal overlay para mejor visibilidad */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-sm w-full border border-red-200 dark:border-red-800 overflow-hidden">
            {/* Header del error */}
            <div className="bg-red-50 dark:bg-red-900/30 px-6 py-4 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Error en el análisis
              </h3>
            </div>

            {/* Contenido del error */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {error}
              </p>
            </div>

            {/* Acciones */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadAnother}
                className="border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={handleUploadAnother}
                className="bg-[var(--user-color,#6366f1)] hover:bg-[var(--user-color,#6366f1)]/90 text-white"
              >
                Subir otra imagen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {step === "results" && stats && (
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
                      stats={stats}
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
          <div className="hidden md:flex justify-center gap-4 mb-3 w-full mx-auto min-h-0 flex-1 overflow-x-auto px-4">
            {imagePreview && (
              // Contenedor 1: Imagen
              <div className="flex-shrink-0 w-[200px] lg:w-[240px]">
                <div className="relative w-full aspect-[2/3] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Imagen del arma"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Contenedor 2: Stats */}
            <div className="flex-shrink-0 flex justify-center w-[200px] lg:w-[240px] min-h-0">
              <WeaponStatsCard
                stats={stats}
                onEdit={handleStatEdit}
                isEditable={true}
                className="w-full h-full"
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
