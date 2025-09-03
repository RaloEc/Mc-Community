'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwipeableTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[];
  defaultTab?: string;
  className?: string;
}

export function SwipeableTabs({ tabs, defaultTab, className = '' }: SwipeableTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [direction, setDirection] = useState<1 | -1>(1); // 1: hacia siguiente (izquierda), -1: hacia anterior (derecha)
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  // Variantes de animación dependientes de la dirección
  const variants = {
    enter: (dir: 1 | -1) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
  } as const;

  const handleTabClick = (targetId: string) => {
    if (targetId === activeTab) return;
    const targetIndex = tabs.findIndex(t => t.id === targetId);
    setDirection(targetIndex > activeIndex ? 1 : -1);
    setActiveTab(targetId);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full"
            drag="x"
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const { offset, velocity } = info;
              // Heurística de swipe: mezcla desplazamiento y velocidad
              const swipePower = Math.abs(offset.x) * 0.5 + Math.abs(velocity.x) * 200;
              const threshold = 100;

              if (swipePower > threshold) {
                if (offset.x < 0 && activeIndex < tabs.length - 1) {
                  // Arrastre hacia la izquierda -> siguiente
                  setDirection(1);
                  setActiveTab(tabs[activeIndex + 1].id);
                } else if (offset.x > 0 && activeIndex > 0) {
                  // Arrastre hacia la derecha -> anterior
                  setDirection(-1);
                  setActiveTab(tabs[activeIndex - 1].id);
                }
              }
            }}
          >
            {tabs.find(tab => tab.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
