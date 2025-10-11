/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desactivar modo estricto para evitar problemas de hidratación
  // Aumentar el timeout para la carga de chunks
  experimental: {
    // Mejoras para evitar errores de carga de chunks
    optimizePackageImports: ['@supabase/auth-helpers-react', '@supabase/auth-helpers-nextjs'],
    // Mejorar la estabilidad del servidor de desarrollo
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // La opción serverActions ya está disponible por defecto en Next.js 14+
  },
  // Configuración para mejorar la estabilidad
  onDemandEntries: {
    // Periodo de tiempo en ms que una página permanecerá en el buffer
    maxInactiveAge: 60 * 60 * 1000, // 1 hora en lugar de 25 segundos predeterminados
    // Número de páginas que se mantendrán en memoria
    pagesBufferLength: 10, // Aumentado para mejor rendimiento
  },
  images: {
    domains: [
      'localhost', 
      'placehold.co', 
      'www.gamespot.com', 
      'www.gameskinny.com', 
      'qeeaptyhcqfaqdecsuqc.supabase.co',
      'qeeaptyhcqfaqdecsuqc.supabase.in',
      'supabase.co',
      'supabase.in'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Configuración de fallbacks para compatibilidad
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      }
      
      // Aumentar el tiempo de espera para la carga de chunks
      config.watchOptions = {
        aggregateTimeout: 1000, // Aumentado para dar más tiempo
        poll: 2000, // Comprobar cambios cada 2 segundos
        ignored: /node_modules/, // Ignorar node_modules para mejor rendimiento
      }
      
      // Configurar el timeout para la carga de chunks
      config.output.chunkLoadTimeout = 120000; // 120 segundos (aumentado)
      
      // En desarrollo, usar nombres de chunk más estables
      if (dev) {
        config.output.filename = 'static/chunks/[name].js';
        config.output.chunkFilename = 'static/chunks/[name].js';
      }
      
      // Optimizar la división de código
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: dev ? 500000 : 200000, // Chunks más grandes en desarrollo
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          // Grupo especial para React Query y Supabase
          reactQuery: {
            test: /[\\/]node_modules[\\/](@tanstack|@supabase)[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      }
      
      // Mejorar el manejo de errores de carga de chunks
      config.output.crossOriginLoading = 'anonymous';
    }
    return config
  },
}

module.exports = nextConfig
