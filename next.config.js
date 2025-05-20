/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Aumentar el timeout para la carga de chunks
  experimental: {
    // Mejoras para evitar errores de carga de chunks
    optimizePackageImports: ['@supabase/auth-helpers-react', '@supabase/auth-helpers-nextjs'],
    // Mejorar la estabilidad del servidor de desarrollo
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Configuración para mejorar la estabilidad
  onDemandEntries: {
    // Periodo de tiempo en ms que una página permanecerá en el buffer
    maxInactiveAge: 60 * 60 * 1000, // 1 hora en lugar de 25 segundos predeterminados
    // Número de páginas que se mantendrán en memoria
    pagesBufferLength: 5,
  },
  images: {
    domains: ['localhost', 'placehold.co', 'www.gamespot.com', 'www.gameskinny.com', 'qeeaptyhcqfaqdecsuqc.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
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
        aggregateTimeout: 300,
        poll: 1000, // Comprobar cambios cada segundo
      }
      
      // Optimizar la división de código
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Agrupar las dependencias comunes
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            reuseExistingChunk: true,
          },
          // Crear un chunk separado para los módulos de Supabase
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase-vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
