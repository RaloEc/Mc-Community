const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Forzar la recarga del SW en cada actualización
  buildExcludes: [/middleware-manifest\.json$/, /_next\/app-build-manifest\.json$/, /\.map$/],
  // Configuración adicional para evitar problemas de caché
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
        }
      }
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        if (!isSameOrigin) return false;
        const pathname = url.pathname;
        // Excluir rutas de API y archivos estáticos que ya tienen su propia política
        if (pathname.startsWith('/api/') || pathname.startsWith('/_next/static/')) {
          return false;
        }
        return true;
      },
      handler: 'NetworkOnly', // Cambiado a NetworkOnly para evitar HTML cacheado
      options: {
        cacheName: 'pages',
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desactivar modo estricto para evitar problemas de hidratación
  // Aumentar el timeout para la carga de chunks
  experimental: {
    // Mejoras para evitar errores de carga de chunks
    optimizePackageImports: [
      '@supabase/auth-helpers-react',
      '@supabase/auth-helpers-nextjs',
      '@fortawesome/react-fontawesome',
      'lucide-react',
    ],
    // Mejorar la estabilidad del servidor de desarrollo
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // La opción serverActions ya está disponible por defecto en Next.js 14+
  },
  // Optimizaciones de compilación para reducir tamaño de bundle
  swcMinify: true,
  compress: true,
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
      'supabase.in',
      'media.tenor.com',
      'tenor.com',
      'korestats.com',
      'www.korestats.com'
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
      },
      {
        protocol: 'https',
        hostname: 'media.tenor.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.tenor.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.communitydragon.org',
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

module.exports = withPWA(nextConfig)
