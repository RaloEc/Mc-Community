# BitArena - Plataforma de la Comunidad Minecraft

BitArena es una plataforma web integral para la comunidad de Minecraft, diseñada para ofrecer una experiencia rica en características para jugadores de todos los niveles, desde principiantes hasta jugadores técnicos y competitivos.

## 🎯 Propósito

Proporcionar un centro integral para la comunidad de Minecraft con noticias actualizadas, recursos, foros de discusión y herramientas para jugadores y administradores de servidores.

## 🏗️ Estructura del Proyecto

```
├── src/
│   ├── app/            # Rutas y páginas de la aplicación
│   ├── components/     # Componentes reutilizables
│   ├── context/        # Contextos de React
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilidades y configuraciones
├── public/             # Archivos estáticos
├── supabase/           # Migraciones y configuraciones de Supabase
└── scripts/            # Scripts de utilidad
```

## 📦 Dependencias Principales

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Framer Motion

### Manejo de Estado y Datos
- React Query
- Zod (validación)
- React Hook Form

### Backend
- Supabase (PostgreSQL, Auth, Storage)
- @supabase/auth-helpers

### UI/UX
- Tailwind CSS
- Lucide React
- React Icons
- Sonner (notificaciones)

### Utilidades
- date-fns
- clsx y tailwind-merge
- uuid

## 🛠️ Archivos de Configuración

- `package.json` - Dependencias y scripts del proyecto
- `tailwind.config.js` - Configuración de Tailwind CSS
- `tsconfig.json` - Configuración de TypeScript
- `next.config.js` - Configuración de Next.js
- `postcss.config.js` - Configuración de PostCSS

## 🚀 Inicio Rápido

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (crear archivo `.env.local` basado en `.env.local.example`)
4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

## 📦 Construir para Producción

```bash
# Construir la aplicación
npm run build

# Iniciar servidor de producción
npm run start
```

## 📝 Licencia

Este proyecto está bajo la licencia MIT.
