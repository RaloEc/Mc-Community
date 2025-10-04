'use client';

import { useState } from 'react';
import { PlusIcon, X, FileText, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type TipoContenido = 'noticias' | 'foro' | 'ambos';

interface BtnCrearFlotanteProps {
  tipo?: TipoContenido;
}

export default function BtnCrearFlotante({ tipo = 'ambos' }: BtnCrearFlotanteProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, profile } = useAuth();
  const colorPersonalizado = profile?.color || 'hsl(222.2, 47.4%, 11.2%)'; // Color por defecto

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const opciones = [
    {
      id: 'noticia',
      label: 'Crear noticia',
      icon: FileText,
      href: '/admin/noticias/crear',
      visible: tipo === 'noticias' || tipo === 'ambos'
    },
    {
      id: 'hilo',
      label: 'Crear hilo',
      icon: MessageSquare,
      href: '/foro/crear-hilo',
      visible: tipo === 'foro' || tipo === 'ambos'
    }
  ].filter(opcion => opcion.visible);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menú desplegable */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 bg-white dark:bg-black rounded-xl shadow-2xl border border-gray-200 dark:border-black overflow-hidden w-48"
            style={{
              '--color-personalizado': colorPersonalizado,
              '--color-personalizado-10': `${colorPersonalizado}1a`,
              '--color-personalizado-20': `${colorPersonalizado}33`
            } as React.CSSProperties}
          >
            <div className="py-1">
              {opciones.map((opcion) => (
                <Link
                  key={opcion.id}
                  href={opcion.href}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                  onClick={() => setMenuAbierto(false)}
                >
                  <opcion.icon 
                    size={16} 
                    className="mr-3 text-primary dark:text-[var(--color-personalizado)] group-hover:opacity-90 transition-opacity" 
                  />
                  <span className="group-hover:text-primary dark:group-hover:text-[var(--color-personalizado)]">
                    {opcion.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 dark:bg-black dark:hover:bg-black/80 hover:scale-110 active:scale-95 border-2"
        style={{
          borderColor: 'var(--color-personalizado)',
          '--color-personalizado': colorPersonalizado,
          '--color-personalizado-hover': `${colorPersonalizado}1a`
        } as React.CSSProperties}
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
      >
        <motion.div
          animate={{ rotate: menuAbierto ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {menuAbierto ? (
            <X 
              size={24} 
              className="text-primary-foreground dark:text-[var(--color-personalizado)]" 
              style={{ color: 'var(--color-personalizado)' }}
            />
          ) : (
            <PlusIcon 
              size={24} 
              className="text-primary-foreground dark:text-[var(--color-personalizado)]"
              style={{ color: 'var(--color-personalizado)' }}
            />
          )}
        </motion.div>
      </button>
    </div>
  );
}
