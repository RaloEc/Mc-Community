import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
import { createServerClient } from '@/utils/supabase-server'
import { GoogleAdsenseScript } from '@/components/ads/GoogleAdsense'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito'
})

export const metadata: Metadata = {
  title: 'Minecraft Community',
  description: 'La comunidad de Minecraft más completa para jugadores competitivos, técnicos y casuales',
}

// Script para prevenir FOUC (Flash of Unstyled Content)
const ThemeScript = () => {
  const themeScript = `
    (function() {
      // Función para obtener el tema guardado o la preferencia del sistema
      function getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        
        // Verificar la preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      
      // Aplicar el tema inicial
      const theme = getInitialTheme();
      const root = document.documentElement;
      
      // Asegurar que solo haya una clase de tema a la vez
      root.classList.remove('light', 'dark', 'amoled');
      root.classList.add(theme);
      
      // Si es amoled, asegurarse de que herede de dark
      if (theme === 'amoled') {
        root.classList.add('dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Obtener el ID de cliente de AdSense desde las variables de entorno
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {adsenseEnabled && <GoogleAdsenseScript clientId={adsenseClientId} />}
      </head>
      <body className={`${nunito.className} min-h-screen`}>
        <Providers session={session}>
          <Header />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
