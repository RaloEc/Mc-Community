'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';

interface WeaponStats {
  damage?: number;
  range?: number;
  control?: number;
  handling?: number;
  stability?: number;
  accuracy?: number;
  armorPenetration?: number;
  fireRate?: number;
  capacity?: number;
  muzzleVelocity?: number;
  soundRange?: number;
}

interface AnalysisResult {
  type: 'stats' | 'descripcion';
  stats?: WeaponStats;
  datos?: WeaponStats;
  descripcion?: string;
  descripcionComica?: string;
  nombreArma?: string | null;
}

type Status = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface AnalysisState {
  status: Status;
  jobId: string | null;
  result: AnalysisResult | null;
  error: string | null;
}

export function WeaponAnalyzer() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    jobId: null,
    result: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling effect: check job status every 2 seconds
  useEffect(() => {
    if (!state.jobId || state.status !== 'processing') {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/check-analysis-status?jobId=${state.jobId}`
        );

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          setState((prev) => ({
            ...prev,
            status: 'completed',
            result: data.result,
          }));
          // Clear polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (data.status === 'failed') {
          // Solo actualizar si error_message NO es NULL
          // Si es NULL, seguir esperando (la Edge Function aún está procesando)
          if (data.error_message) {
            setState((prev) => ({
              ...prev,
              status: 'error',
              error: data.error_message,
            }));
            // Clear polling interval
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
          // Si error_message es NULL, continuar haciendo polling
        }
        // If still 'processing', do nothing and continue polling
      } catch (error) {
        console.error('[WeaponAnalyzer] Polling error:', error);
        // Continue polling on error
      }
    };

    // Esperar 1.5 segundos antes de empezar a hacer polling
    // Esto da tiempo a que la Edge Function termine y actualice el job
    const initialDelay = setTimeout(() => {
      // Hacer un poll inmediato
      pollStatus();
      
      // Luego empezar el intervalo
      pollingIntervalRef.current = setInterval(pollStatus, 2000);
    }, 1500);

    // Cleanup
    return () => {
      clearTimeout(initialDelay);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [state.jobId, state.status]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setState({
      status: 'uploading',
      jobId: null,
      result: null,
      error: null,
    });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);

      // Upload file and create job
      const response = await fetch('/api/analyze-weapon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (!data.jobId) {
        throw new Error('No jobId returned');
      }

      // Update state to start polling
      setState({
        status: 'processing',
        jobId: data.jobId,
        result: null,
        error: null,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setState({
        status: 'error',
        jobId: null,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleReset = () => {
    setState({
      status: 'idle',
      jobId: null,
      result: null,
      error: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        Analizador de Armas
      </h2>

      {/* File Input */}
      {state.status === 'idle' && (
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Selecciona una imagen de arma
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="block w-full text-sm text-slate-500 dark:text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              dark:file:bg-blue-900 dark:file:text-blue-200
              hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Máximo 5MB. Formatos: JPEG, PNG, WebP
          </p>
        </div>
      )}

      {/* Loading State */}
      {state.status === 'uploading' && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-slate-600 dark:text-slate-300">
            Subiendo imagen...
          </span>
        </div>
      )}

      {/* Processing State */}
      {state.status === 'processing' && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-slate-600 dark:text-slate-300">
            Analizando imagen...
          </span>
        </div>
      )}

      {/* Success State */}
      {state.status === 'completed' && state.result && (
        <div className="mb-4">
          <div className="flex items-center mb-4 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-semibold">Análisis completado</span>
          </div>

          {state.result.type === 'stats' && state.result.stats && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {state.result.stats.damage !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Daño:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.damage}
                    </span>
                  </div>
                )}
                {state.result.stats.range !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Alcance:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.range}m
                    </span>
                  </div>
                )}
                {state.result.stats.control !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Control:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.control}
                    </span>
                  </div>
                )}
                {state.result.stats.handling !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Manejo:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.handling}
                    </span>
                  </div>
                )}
                {state.result.stats.stability !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Estabilidad:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.stability}
                    </span>
                  </div>
                )}
                {state.result.stats.accuracy !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Precisión:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.accuracy}
                    </span>
                  </div>
                )}
                {state.result.stats.armorPenetration !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Perforación:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.armorPenetration}
                    </span>
                  </div>
                )}
                {state.result.stats.fireRate !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Cadencia:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.fireRate} dpm
                    </span>
                  </div>
                )}
                {state.result.stats.capacity !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Capacidad:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.capacity}
                    </span>
                  </div>
                )}
                {state.result.stats.muzzleVelocity !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Velocidad:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.muzzleVelocity} m/s
                    </span>
                  </div>
                )}
                {state.result.stats.soundRange !== undefined && (
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Sonido:
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {state.result.stats.soundRange}m
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {state.result.type === 'descripcion' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {state.result.descripcionComica || state.result.descripcion || 'No se pudieron extraer estadísticas'}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Analizar otra imagen
          </button>
        </div>
      )}

      {/* Error State */}
      {state.status === 'error' && (
        <div className="mb-4">
          <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-semibold">Error</span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {state.error}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
