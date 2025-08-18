'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, ChevronDown, Download, Box, Code, Star, ArrowRight } from 'lucide-react';
import BotonVerMas from '@/components/BotonVerMas';
import BotonIcono from '@/components/BotonIcono';
import NoticiasMiniatura from '@/components/NoticiasMiniatura';
import BotonNoticias from '@/components/BotonNoticias';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { FeaturedMods } from '@/components/mods/FeaturedMods';
import AdBanner from '@/components/ads/AdBanner';
import AdRectangle from '@/components/ads/AdRectangle';
import ForosBloque from '@/components/foro/ForosBloque';

export default function Home() {
  const { session, loading } = useAuth();
  
  // Manejar el caso donde la autenticación está cargando
  const isAuthenticated = !loading && session !== null;

  // Estado para las estadísticas
  const [stats, setStats] = useState({
    totalMods: 0,
    totalDownloads: 0,
    totalCategories: 0,
    loading: true,
    error: null as string | null
  });

  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient();
        
        // Obtener estadísticas de los mods
        const { count: totalMods, error: modsError } = await supabase
          .from('mods')
          .select('*', { count: 'exact', head: true });

        if (modsError) throw modsError;

        // Obtener el total de descargas sumando el campo total_downloads de todos los mods
        let totalDownloads = 0;
        try {
          const { data: downloadsData, error: downloadsError } = await supabase
            .from('mods')
            .select('total_downloads'); // Usamos total_downloads que es el nombre correcto de la columna

          if (!downloadsError && downloadsData) {
            totalDownloads = downloadsData.reduce((sum, mod) => sum + (mod.total_downloads || 0), 0) || 0;
          }
        } catch (downloadError) {
          console.log('No se pudo obtener las descargas, usando valor predeterminado');
          // No lanzamos el error para que la página siga cargando
        }

        // Usamos las categorías únicas de los mods existentes en lugar de consultar una tabla que no existe
        let totalCategories = 0;
        try {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('mods')
            .select('categories');

          if (!categoriesError && categoriesData) {
            // Obtenemos todas las categorías únicas de todos los mods
            const allCategories = new Set();
            categoriesData.forEach(mod => {
              if (mod.categories && Array.isArray(mod.categories)) {
                mod.categories.forEach(category => allCategories.add(category));
              }
            });
            totalCategories = allCategories.size;
          }
        } catch (categoriesError) {
          console.log('No se pudieron obtener las categorías, usando valor predeterminado');
          // No lanzamos el error para que la página siga cargando
        }

        setStats({
          totalMods: totalMods || 0,
          totalDownloads,
          totalCategories: totalCategories || 0,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo más tarde.'
        }));
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 dark:from-amoled-black dark:to-amoled-black/95">
      
      {/* Hero Section - Solo se muestra si no hay sesión iniciada */}
      {!isAuthenticated && (
        <section className="relative py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('/minecraft-epic-landscape.jpeg')] bg-cover bg-center opacity-10 dark:opacity-5"></div>
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              {/* Etiqueta de versión eliminada */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground dark:text-white sm:text-5xl md:text-6xl">
                Bienvenido a <span className="text-primary">Comunidad MC</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground dark:text-gray-300">
                Explora, conecta y comparte en nuestra vibrante comunidad. Descubre las últimas noticias, participa en debates enriquecedores y forma parte de un espacio donde todas las voces importan.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link href="/foro" passHref>
                  <Button size="lg" className="flex items-center gap-2 dark:bg-primary dark:text-white dark:hover:bg-primary/90">
                    <Star className="h-5 w-5" />
                    <span>Visitar Foro</span>
                  </Button>
                </Link>
                <Link href="/login" passHref>
                  <Button variant="outline" size="lg" className="flex items-center gap-2 dark:border-white dark:text-white dark:hover:bg-white/10">
                    <span>Iniciar Sesión</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Anuncio rectangular en medio - Siempre visible */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <AdRectangle className="my-4" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-16 no-transition">
        {/* Sección de noticias */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Últimas Noticias</h2>
            <BotonNoticias />
          </div>
          <NoticiasMiniatura limit={4} />
        </section>
        
        {/* Sección de foros */}
        <ForosBloque limit={5} />

        {/* Secciones temporalmente ocultas - Tutoriales, construcciones y mods destacados */}
        {/* 
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Tutoriales y Construcciones</h2>
            <BotonVerMas href="/tutoriales" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Tarjetas de tutoriales y construcciones ocultas -->
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Mods Destacados</h2>
            <BotonVerMas href="/mods" />
          </div>
          <FeaturedMods />
        </section>
        */}
      </main>
      
      {/* Banner de anuncios inferior - Siempre visible */}
      <div className="container mx-auto px-4 pb-12">
        <AdBanner className="my-4" />
      </div>
    </div>
  );
}
