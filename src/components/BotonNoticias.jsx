'use client';

import { useRouter } from 'next/navigation';

export default function BotonNoticias() {
  const router = useRouter();

  const irANoticias = () => {
    router.push('/noticias');
  };

  return (
    <button
      onClick={irANoticias}
      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
      style={{ position: 'relative', zIndex: 10 }}
    >
      Ver todas las noticias
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
    </button>
  );
}
