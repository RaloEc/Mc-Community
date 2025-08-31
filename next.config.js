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
    // Deshabilitar Edge Runtime para componentes que usan módulos de Node.js
    runtime: 'nodejs',
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
  webpack: (config, { isServer }) => {
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
      }
      
      // Configurar el timeout para la carga de chunks
      config.output.chunkLoadTimeout = 60000; // 60 segundos
      
      // Optimizar la división de código - simplificada para evitar problemas
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25, // Aumentar el límite de solicitudes iniciales
        minSize: 20000, // Tamaño mínimo para crear un chunk
        maxSize: 200000, // Tamaño máximo para un chunk
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
