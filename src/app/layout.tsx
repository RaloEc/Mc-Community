import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import { createServerClient } from "@/utils/supabase-server";
import { GoogleAdsenseScript } from "@/components/ads/GoogleAdsense";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Minecraft Community",
  description:
    "La comunidad de Minecraft más completa para jugadores competitivos, técnicos y casuales",
};

// Script para prevenir FOUC (Flash of Unstyled Content)
const ThemeScript = () => {
  // Script que se ejecuta antes de la hidratación para evitar parpadeo
  // Soporta: light, dark, y system (prefers-color-scheme)
  const themeScript = `
    (function() {
      try {
        const storageKey = 'mc-community-theme';
        const savedTheme = localStorage.getItem(storageKey);
        
        // Función para aplicar el tema
        function applyTheme(theme) {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        }
        
        // Determinar el tema a aplicar
        if (savedTheme === 'light' || savedTheme === 'dark') {
          applyTheme(savedTheme);
        } else {
          // Si no hay tema guardado o es 'system', usar preferencia del sistema
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          applyTheme(prefersDark ? 'dark' : 'light');
        }
      } catch (e) {
        // Fallback: usar preferencia del sistema o dark por defecto
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    })();
  `;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usamos try/catch para manejar posibles errores en la obtención de la sesión
  let session = null;
  let userColor = "#3b82f6"; // Color por defecto

  try {
    const supabase = createServerClient();
    const { data } = await supabase.auth.getSession();
    session = data.session;

    // Obtener el perfil del usuario para el color personalizado
    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from("perfiles")
        .select("color")
        .eq("id", session.user.id)
        .single();

      if (profile?.color) {
        userColor = profile.color;
      }
    }
  } catch (error) {
    console.error("Error al obtener la sesión o el perfil:", error);
  }

  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
  const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {adsenseEnabled && <GoogleAdsenseScript clientId={adsenseClientId} />}
      </head>
      <body
        className={`${nunito.variable} font-sans bg-background text-foreground min-h-screen`}
      >
        <Providers session={session} userColor={userColor}>
          <Header />
          <main className="container mx-auto px-3">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
