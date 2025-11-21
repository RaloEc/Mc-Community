"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";

export type CategoryType =
  | "actualizacion"
  | "parche"
  | "evento"
  | "torneo"
  | "noticia"
  | "anuncio"
  | "guia"
  | "trucos"
  | "mods"
  | "comunidad"
  | "default";

interface CategoryBadgeProps {
  type: CategoryType | string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

// Mapeo de colores por categoría (WCAG AA compliant)
const categoryColors: Record<
  CategoryType,
  { light: string; dark: string; lightText: string; darkText: string }
> = {
  actualizacion: {
    light: "bg-blue-100 dark:bg-blue-500/20",
    dark: "dark:bg-blue-500/20",
    lightText: "text-blue-700 dark:text-blue-300",
    darkText: "dark:text-blue-200",
  },
  parche: {
    light: "bg-green-100 dark:bg-green-500/20",
    dark: "dark:bg-green-500/20",
    lightText: "text-green-700 dark:text-green-300",
    darkText: "dark:text-green-200",
  },
  evento: {
    light: "bg-purple-100 dark:bg-purple-500/20",
    dark: "dark:bg-purple-500/20",
    lightText: "text-purple-700 dark:text-purple-300",
    darkText: "dark:text-purple-200",
  },
  torneo: {
    light: "bg-orange-100 dark:bg-orange-500/20",
    dark: "dark:bg-orange-500/20",
    lightText: "text-orange-700 dark:text-orange-300",
    darkText: "dark:text-orange-200",
  },
  noticia: {
    light: "bg-cyan-100 dark:bg-cyan-500/20",
    dark: "dark:bg-cyan-500/20",
    lightText: "text-cyan-700 dark:text-cyan-300",
    darkText: "dark:text-cyan-200",
  },
  anuncio: {
    light: "bg-red-100 dark:bg-red-500/20",
    dark: "dark:bg-red-500/20",
    lightText: "text-red-700 dark:text-red-300",
    darkText: "dark:text-red-200",
  },
  guia: {
    light: "bg-yellow-100 dark:bg-yellow-500/20",
    dark: "dark:bg-yellow-500/20",
    lightText: "text-yellow-700 dark:text-yellow-300",
    darkText: "dark:text-yellow-200",
  },
  trucos: {
    light: "bg-pink-100 dark:bg-pink-500/20",
    dark: "dark:bg-pink-500/20",
    lightText: "text-pink-700 dark:text-pink-300",
    darkText: "dark:text-pink-200",
  },
  mods: {
    light: "bg-rose-100 dark:bg-rose-500/20",
    dark: "dark:bg-rose-500/20",
    lightText: "text-rose-700 dark:text-rose-300",
    darkText: "dark:text-rose-200",
  },
  comunidad: {
    light: "bg-violet-100 dark:bg-violet-500/20",
    dark: "dark:bg-violet-500/20",
    lightText: "text-violet-700 dark:text-violet-300",
    darkText: "dark:text-violet-200",
  },
  default: {
    light: "bg-slate-100 dark:bg-slate-500/20",
    dark: "dark:bg-slate-500/20",
    lightText: "text-slate-700 dark:text-slate-300",
    darkText: "dark:text-slate-200",
  },
};

/**
 * Componente CategoryBadge reutilizable
 *
 * Características:
 * - WCAG AA compliant (contraste ≥ 4.5:1)
 * - Soporte completo para modo oscuro AMOLED
 * - Sin estilos inline (usa clases Tailwind)
 * - Accesible y semántico
 * - Normalización de tipos (case-insensitive)
 * - Selección segura de colores con fallback
 *
 * Ejemplo:
 * <CategoryBadge type="actualizacion" label="Actualización" icon={<Clock />} />
 */
export function CategoryBadge({
  type,
  label,
  icon,
  className = "",
  variant = "default",
}: CategoryBadgeProps) {
  // Normalizar el tipo: convertir a minúsculas y seleccionar de forma segura
  const normalizedType = (type?.toLowerCase() || "default") as CategoryType;
  const currentColors =
    categoryColors[normalizedType] || categoryColors.default;

  // Clases base para el badge
  const baseClasses =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200";

  // Clases según variante
  const variantClasses = {
    default: cn(
      currentColors.light,
      currentColors.lightText,
      "border border-current/20 dark:border-current/30"
    ),
    outline: cn(
      "border border-current/40 dark:border-current/50 bg-transparent",
      currentColors.lightText
    ),
    secondary: cn(
      currentColors.dark,
      currentColors.darkText,
      "dark:border dark:border-current/40"
    ),
  };

  return (
    <Badge
      className={cn(baseClasses, variantClasses[variant], className)}
      role="status"
      aria-label={label || normalizedType}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label && <span>{label}</span>}
    </Badge>
  );
}

/**
 * Función para obtener el label de una categoría
 * Soporta tipos normalizados (case-insensitive)
 */
export function getCategoryLabel(type: CategoryType | string): string {
  const normalizedType = (type?.toLowerCase() || "default") as CategoryType;

  const labels: Record<CategoryType, string> = {
    actualizacion: "Actualización",
    parche: "Parche",
    evento: "Evento",
    torneo: "Torneo",
    noticia: "Noticia",
    anuncio: "Anuncio",
    guia: "Guía",
    trucos: "Trucos",
    mods: "Mods",
    comunidad: "Comunidad",
    default: "Categoría",
  };

  return labels[normalizedType] || labels.default;
}
