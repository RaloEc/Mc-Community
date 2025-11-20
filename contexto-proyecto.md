# Contexto del Proyecto

## Nombre: KoreStats

## Stack Tecnológico

- **Frontend:** Next.js 14 con App Router y soporte híbrido (SSR/SSG/ISR).
- **Autenticación y Datos:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Estilos:** TailwindCSS + shadcn/ui + tokens personalizados.
- **Estado y Caché:** TanStack Query para datos en cliente y caché optimizada.
- **Lenguaje:** TypeScript con tipado estricto y módulos compartidos.
- **PWA y rendimiento:** next-pwa, Web Vitals monitor y optimizaciones de Core Web Vitals.

## Objetivo

KoreStats busca ser el centro de inteligencia para jugadores y comunidades competitivas:

- 📊 Dashboards con métricas de rendimiento, tendencias y alertas.
- 📰 Noticias, eventos y comunicados oficiales en un feed curado.
- 💬 Foros temáticos y herramientas sociales (seguidores, amistades, status en tiempo real).
- 🎮 Directorios de servidores y recursos (mods, shaders, texturas) con filtros y reseñas.
- 🛠️ Consola para administradores: analíticas, moderación y workflows colaborativos.
- 📱 Experiencia PWA para acceso offline, notificaciones y multitarea.

## Despliegue

- **Plataforma:** Netlify (compatible con Vercel como alternativa).
- **Características:**
  - CI/CD desde rama principal con validaciones automáticas.
  - Preview deploys para QA y revisión de contenido.
  - Funciones serverless para endpoints externos y tareas programadas.
  - Caché avanzada (Edge + Netlify CDN) con invalidaciones controladas.

## Estilo y Experiencia de Usuario

- **Diseño:** Minimalista, orientado a datos y con jerarquía visual clara.
- **Temas:** Soporte completo para modo claro/oscuro + modo AMOLED.
- **Animaciones:** Microinteracciones con Framer Motion y transiciones suaves.
- **Accesibilidad:** Composición basada en Radix + WCAG AA.
- **Responsive:** Layouts adaptativos desde móviles hasta pantallas ultra-wide.

## Características Técnicas Destacadas

- Renderizado híbrido (SSR/SSG/ISR) con almacenamiento en caché incremental.
- Optimización de imágenes y assets mediante Next/Image y políticas personalizadas.
- Autenticación segura (Supabase Auth + PKCE) y sesiones persistentes.
- Realtime con Supabase Channels para foros, notificaciones y dashboards.
- Sistema de editor enriquecido (TipTap) con extensiones personalizadas.
- Integración con APIs externas (Modrinth, Twitter/X, Riot) mediante adaptadores.
- PWA completo (manifest, service worker, prompts de instalación y offline fallback).

## Estructura de Directorios Principales

- `/src/app` – Rutas, layouts anidados y handlers de API.
- `/src/components` – UI modular (navegación, cards, widgets, PWA, Ads).
- `/src/context` – Providers globales: Auth, UI state, analytics.
- `/src/hooks` – Hooks reutilizables para formularios, modales, métricas.
- `/src/lib` – Integraciones con Supabase, Modrinth, temas y utilidades.
- `/src/services` – Adaptadores para APIs externas y colas internas.
- `/supabase` – Esquemas, policies y seeds para entornos locales/remotos.
- `/docs` – Guías funcionales, despliegue y acuerdos de diseño.
