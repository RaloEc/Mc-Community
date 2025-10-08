'use client';

import { motion } from 'framer-motion';
import BtnCrearFlotante from '@/components/BtnCrearFlotante';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import BannerPublicitario from '@/components/home/BannerPublicitario';
import NoticiasDestacadas from '@/components/home/NoticiasDestacadas';
import SeccionForo from '@/components/home/SeccionForo';
import ForoCategoriasWidget from '@/components/home/ForoCategoriasWidget';

export default function Home() {
  const { user } = useAuth();
  const authModal = useAuthModal();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      

      <main className="container mx-auto px-0 py-0">
        <motion.div
          className="space-y-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Noticias destacadas con imágenes grandes */}
          <motion.div variants={fadeInUp}>
            <NoticiasDestacadas className="mb-24" />
          </motion.div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal - Contenido */}
            <div className="lg:col-span-2 space-y-8">
              {/* Banner publicitario intermedio */}
              <motion.div variants={fadeInUp} className="flex justify-center">
                <BannerPublicitario 
                  variant="horizontal" 
                  className="w-full max-w-2xl" 
                />
              </motion.div>

              {/* Sección del foro */}
              <motion.div variants={fadeInUp}>
                <SeccionForo />
              </motion.div>
            </div>

            {/* Sidebar derecha */}
            <div className="space-y-6">
              {/* Banner publicitario vertical */}
              <motion.div variants={fadeInUp} className="hidden lg:block">
                <BannerPublicitario 
                  variant="vertical" 
                  className="w-full" 
                />
              </motion.div>

              {/* Información adicional o widgets */}
              <motion.div variants={fadeInUp}>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    Acerca de BitArena
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    ¡Bienvenido a BitArena! Tu espacio para estar al día con las últimas noticias sobre tecnología, IA, software, videojuegos y más. Participa en nuestros foros, comparte conocimientos y conéctate con una comunidad apasionada por la innovación tecnológica.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1.2K+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Miembros</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">500+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Hilos</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Widget de categorías del foro */}
              <motion.div variants={fadeInUp} className="mt-6">
                <ForoCategoriasWidget />
              </motion.div>

              {/* Banner publicitario cuadrado */}
              <motion.div variants={fadeInUp} className="hidden lg:block">
                <BannerPublicitario 
                  variant="square" 
                  className="w-full" 
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Banner publicitario inferior */}
      <div className="flex justify-center py-6">
        <BannerPublicitario 
          variant="horizontal" 
          className="w-full max-w-4xl" 
        />
      </div>
      
      {/* Botón flotante para crear contenido (solo móvil/tablet) */}
      <div className="lg:hidden">
        <BtnCrearFlotante tipo="foro" />
      </div>
      
      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        redirectTo={authModal.redirectTo}
      />
    </div>
  );
}
