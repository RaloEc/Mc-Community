'use client';

import { useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => {
    if (!isBrowser) {
      return false;
    }
    return window.innerWidth < 1024; // lg breakpoint
  });
  const [isLoaded, setIsLoaded] = useState(isBrowser);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsLoaded(true);
    };

    const rafId = window.requestAnimationFrame(checkDevice);
    window.addEventListener('resize', checkDevice);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  useEffect(() => {
    if (!isBrowser || isLoaded) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsLoaded(true), 200);
    return () => window.clearTimeout(timeoutId);
  }, [isLoaded]);

  return { isMobile, isLoaded };
}
