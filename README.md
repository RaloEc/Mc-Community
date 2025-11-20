# KoreStats - Plataforma de Inteligencia para Gamers

KoreStats es una plataforma integral de estadísticas, comunidad y recursos para jugadores de videojuegos. Proporciona tableros de rendimiento, foros temáticos, directorios de servidores y herramientas sociales para potenciar la colaboración entre jugadores, administradores y creadores de contenido.

## 🎯 Propósito

- Centralizar la información clave (rendimiento, noticias, eventos) en un único panel.
- Proveer herramientas sociales y colaborativas (foros, seguidores, amistades, PWA).
- Simplificar la gestión de recursos (mods, texturas, servidores, guías) con filtros y curaduría.

## 🏗️ Estructura del Proyecto

```
├── src/
│   ├── app/                # Rutas y páginas del App Router
│   ├── components/         # UI compartida (navegación, cards, PWA, layouts)
│   ├── context/            # Contextos globales (auth, tema, foro, analytics)
│   ├── hooks/              # Hooks personalizados (modales, formularios, métricas)
│   ├── lib/                # Integraciones externas y utilidades (Supabase, Modrinth)
│   ├── services/           # Adaptadores y lógica para APIs de terceros
│   ├── styles/             # CSS crítico, Tailwind y estilos globales
│   └── types/              # Tipos compartidos para noticias, foros, usuarios, mods
├── public/                 # Assets estáticos, manifest y recursos PWA
├── supabase/               # Esquemas, migraciones y seeds para Supabase
├── scripts/                # Scripts para sincronización y mantenimiento
└── docs/                   # Documentación funcional, despliegue y guías internas
```

## 📦 Dependencias Principales

| Categoría                 | Librerías clave                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Framework y UI**        | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **Estado y formularios**  | TanStack Query, React Hook Form, Zod                                               |
| **Integración y backend** | Supabase (auth, DB, storage, realtime), @supabase/ssr, @ducanh2912/next-pwa        |
| **Visuales y UX**         | Lucide React, React Icons, Sonner, Embla Carousel                                  |
| **Utilidades**            | date-fns, clsx, tailwind-merge, uuid, react-intersection-observer                  |

## 🛠️ Archivos de Configuración

- `package.json` – scripts, dependencias y engines soportados.
- `next.config.js` – optimizaciones de build, PWA y políticas de imágenes.
- `tailwind.config.js` – temas, breakpoints y tokens visuales.
- `tsconfig.json` – rutas, strict mode y configuración de TypeScript.
- `postcss.config.js` – pipeline de estilos (Tailwind, autoprefixer).
- `supabase/config.toml` – sincronización de esquemas y políticas de acceso.

## 🚀 Inicio Rápido

1. Clonar el repositorio.
2. Copiar `.env.local.example` a `.env.local` y completar las variables requeridas (Supabase, APIs externas, Ads, etc.).
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. (Opcional) Ejecutar migraciones locales de Supabase:
   ```bash
   npx supabase db push
   ```
5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
6. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 📦 Construir y Desplegar

```bash
# Construir la aplicación para producción
npm run build

# Servir el build compilado
npm run start

# (Opcional) Lint y pruebas
npm run lint && npm run test
```

Listo para desplegar en Netlify o Vercel (build command `npm run build`, output `.next`).

## 📝 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
