'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * Error Boundary para capturar errores de carga de chunks y otros errores
 * Maneja específicamente los ChunkLoadError que ocurren en desarrollo
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Detectar si es un error de carga de chunks
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError');

    return {
      hasError: true,
      error,
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log del error para debugging
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    // Si es un error de chunk, intentar recargar automáticamente después de un delay
    if (this.state.isChunkError) {
      console.log('ChunkLoadError detectado, preparando recarga...');
      
      // Esperar un momento antes de recargar para evitar loops infinitos
      setTimeout(() => {
        console.log('Recargando página debido a ChunkLoadError...');
        window.location.reload();
      }, 1000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      isChunkError: false,
    });
    
    // Recargar la página para obtener los chunks actualizados
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Para errores de chunk, mostrar un mensaje específico
      if (this.state.isChunkError) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-8 max-w-md">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Actualizando aplicación...
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                La aplicación se está actualizando. Recargando automáticamente...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            </div>
          </div>
        );
      }

      // Para otros errores, mostrar un mensaje genérico
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8 max-w-md">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Algo salió mal
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </p>
            <Button onClick={this.handleReset} variant="default">
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
