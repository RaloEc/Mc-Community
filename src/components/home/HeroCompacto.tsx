'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuthModal } from '@/hooks/useAuthModal';

interface HeroCompactoProps {
  isAuthenticated: boolean;
}

export default function HeroCompacto({ isAuthenticated }: HeroCompactoProps) {
  const authModal = useAuthModal();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  if (isAuthenticated) {
    return null; // No mostrar hero para usuarios autenticados
  }

  return (
    <motion.section 
      className="relative py-12 md:py-16 overflow-hidden"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-indigo-600/10 dark:from-blue-500/5 dark:via-purple-500/3 dark:to-indigo-500/5"></div>
      
      {/* Elementos decorativos */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1 
            className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl"
            variants={fadeInUp}
          >
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              BitArena
            </span>
          </motion.h1>
          
          <motion.p 
            className="mb-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Tu comunidad para descubrir las últimas noticias, participar en discusiones y conectar con otros jugadores.
          </motion.p>
          
          {/* Call-to-action buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-8"
            variants={fadeInUp}
          >
            <Link href="/foro">
              <Button 
                size="lg" 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Explorar Foro</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500 transition-all duration-300" 
              onClick={() => authModal.openLogin()}
            >
              <Users className="h-5 w-5" />
              <span>Unirse Ahora</span>
            </Button>
          </motion.div>
          
          {/* Estadísticas rápidas */}
          <motion.div 
            className="grid grid-cols-3 gap-6 max-w-md mx-auto"
            variants={fadeInUp}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Miembros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1.2K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Discusiones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">50+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Noticias</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
