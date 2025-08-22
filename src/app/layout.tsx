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
  // Script simplificado para evitar problemas de hidratación
  const themeScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.classList.add(savedTheme);
      } catch (e) {
        document.documentElement.classList.add('dark');
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
  // Usamos try/catch para manejar posibles errores en la obtención de la sesión
  let session = null;
  try {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    console.error('Error al obtener la sesión:', error)
  }

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
