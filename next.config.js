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
    // Tree-shaking optimizado para librerías pesadas
    optimizePackageImports: [
      '@supabase/auth-helpers-react',
      '@supabase/auth-helpers-nextjs',
      '@fortawesome/react-fontawesome',
      '@nextui-org/react',
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion',
      'date-fns',
      'lodash',
      'react-hot-toast',
      'zustand',
    ],
    // Mejorar la estabilidad del servidor de desarrollo
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // La opción serverActions ya está disponible por defecto en Next.js 14+
  },
  // Optimizaciones de compilación para reducir tamaño de bundle
  swcMinify: true,
  compress: true,
  // Optimizar CSS y reducir render-blocking resources
  productionBrowserSourceMaps: false,
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
      'www.korestats.com',
      'i.ytimg.com'
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
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
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
      
      // Mejorar el manejo de errores de carga de chunks
      config.output.crossOriginLoading = 'anonymous';
    }
    return config
  },
}

module.exports = withPWA(nextConfig)
