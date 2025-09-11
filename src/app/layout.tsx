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
  // Script que se ejecuta antes de la hidratación para evitar parpadeo
  // Solo soporta modo claro y AMOLED puro (#000000)
  const themeScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('theme');
        // Solo permitir 'light' o 'dark' (AMOLED)
        if (savedTheme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // Por defecto AMOLED (dark con #000000 puro)
          document.documentElement.classList.add('dark');
          document.documentElement.style.setProperty('--amoled-black', '#000000');
        }
      } catch (e) {
        // Fallback a AMOLED
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--amoled-black', '#000000');
      }
    })();
  `;

  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usamos try/catch para manejar posibles errores en la obtención de la sesión
  let session = null;
  try {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    console.error('Error al obtener la sesión:', error)
  }

  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {adsenseEnabled && <GoogleAdsenseScript clientId={adsenseClientId} />}
      </head>
      <body className={`${nunito.variable} font-sans bg-background text-foreground min-h-screen`}>
        <Providers session={session}>
          <Header />
          <main className="container mx-auto px-4">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
