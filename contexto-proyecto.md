# Contexto del Proyecto

## Nombre: KoreStats

## Stack Tecnológico

- **Frontend**: Next.js 14 con App Router
- **Base de Datos y Autenticación**: Supabase (PostgreSQL)
- **Estilos**: TailwindCSS con componentes de shadcn/ui
- **Manejo de Estado**: React Query para gestión de datos en el cliente
- **Lenguaje**: TypeScript para tipado estático

## Objetivo

KoreStats es una plataforma web integral de estadísticas y análisis para jugadores que incluye:

- 📊 Estadísticas avanzadas y análisis de rendimiento
- 🎮 Integración con múltiples juegos y plataformas
- 📰 Sección de noticias y actualizaciones
- 📚 Recursos y guías comunitarias
- 💬 Foro de discusión
- 🛠️ Herramientas de análisis para jugadores

## Despliegue

- **Plataforma**: Netlify
- **Características**:
  - Despliegue continuo desde rama principal
  - Preview Deploys para pull requests
  - Funciones serverless para endpoints API

## Estilo y Experiencia de Usuario

- **Diseño**: Enfoque minimalista con jerarquía visual clara
- **Temas**: Soporte para modo oscuro/claro con transiciones suaves
- **Animaciones**: Uso de Framer Motion para interacciones fluidas
- **Accesibilidad**: Componentes accesibles siguiendo las pautas WCAG
- **Responsive**: Diseño adaptativo para móviles, tablets y escritorio

## Características Técnicas Destacadas

- Renderizado híbrido (SSR/SSG/ISR)
- Optimización de imágenes con Next.js Image
- Autenticación segura con Supabase Auth
- Base de datos en tiempo real con Supabase
- Sistema de caché y estado global con React Query
- Editor de texto enriquecido con TipTap
- Componentes UI accesibles y personalizables

## Estructura de Directorios Principales

- `/src/app` - Rutas y páginas de la aplicación
- `/src/components` - Componentes reutilizables
- `/src/context` - Contextos de React
- `/src/hooks` - Custom hooks
- `/src/lib` - Utilidades y configuraciones
- `/public` - Archivos estáticos
- `/supabase` - Migraciones y configuraciones de Supabase
