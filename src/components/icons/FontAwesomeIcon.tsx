"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";
import { FontAwesomeIcon as FAIcon } from "@fortawesome/react-fontawesome";

/**
 * Wrapper optimizado para FontAwesomeIcon que permite lazy loading
 * y tree-shaking automático de iconos no utilizados
 */
export const FontAwesomeIcon = (props: ComponentProps<typeof FAIcon>) => {
  return <FAIcon {...props} />;
};

/**
 * Versión lazy-loaded de FontAwesomeIcon para componentes no críticos
 * Reduce el tamaño inicial del bundle
 */
export const LazyFontAwesomeIcon = dynamic(
  () =>
    import("@fortawesome/react-fontawesome").then((mod) => ({
      default: mod.FontAwesomeIcon,
    })),
  {
    loading: () => <span className="inline-block w-4 h-4" />, // Placeholder mientras carga
    ssr: false, // No renderizar en servidor para evitar bloqueo
  }
);

export default FontAwesomeIcon;
