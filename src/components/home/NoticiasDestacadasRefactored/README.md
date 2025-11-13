# 📰 NoticiasDestacadas - Componente Refactorizado

Componente modular para mostrar noticias destacadas en la página principal.

## 📁 Estructura

```
NoticiasDestacadasRefactored/
├── index.tsx                    # Componente principal (orquestador)
├── constants.ts                 # Constantes y configuración
├── types.ts                     # Interfaces TypeScript
├── QueryProvider.tsx            # Provider de React Query
├── NewsTicker.tsx              # Ticker de noticias
├── NewsHeader.tsx              # Encabezado con pestañas
├── FeaturedNews.tsx            # Noticia destacada
├── NewsGrid.tsx                # Grid de noticias secundarias
├── NewsSidebar.tsx             # Barra lateral
├── SubscriptionSection.tsx     # Sección de suscripción
├── NewsSkeleton.tsx            # Estado de carga
└── hooks/
    ├── useNoticias.ts          # Hook para gestionar noticias
    ├── useNewsTicker.ts        # Hook para el ticker
    └── useThemeDetection.ts    # Hook para detectar tema
```

## 🎯 Componentes

### **index.tsx** (Principal)
Orquesta todos los subcomponentes y gestiona el estado global.

**Props:**
- `className?: string` - Clases CSS adicionales

**Uso:**
```tsx
<NoticiasDestacadas className="mb-24" />
```

### **NewsTicker.tsx**
Ticker de noticias en movimiento horizontal.

**Props:**
- `userColor: string` - Color personalizado del usuario

### **NewsHeader.tsx**
Encabezado con pestañas de navegación.

**Props:**
- `activeTab: TabType` - Pestaña activa
- `onTabChange: (tab: TabType) => void` - Callback al cambiar pestaña
- `userColor: string` - Color personalizado

### **FeaturedNews.tsx**
Noticia destacada grande con imagen.

**Props:**
- `noticia: Noticia` - Datos de la noticia
- `isDarkMode: boolean` - Modo oscuro activo
- `userColor: string` - Color personalizado
- `profileColor: string | null` - Color del perfil
- `onProfileClick: (e, username) => void` - Callback al hacer click en perfil

### **NewsGrid.tsx**
Grid de noticias secundarias (2 columnas).

**Props:**
- `noticias: Noticia[]` - Array de noticias
- `isDarkMode: boolean` - Modo oscuro activo
- `userColor: string` - Color personalizado
- `profileColor: string | null` - Color del perfil
- `onProfileClick: (e, username) => void` - Callback al hacer click en perfil

### **NewsSidebar.tsx**
Barra lateral con últimas noticias, eventos y categorías.

**Props:**
- `ultimasNoticias: Noticia[]` - Últimas noticias
- `userColor: string` - Color personalizado
- `adjustedPrimaryColor: string` - Color ajustado según tema
- `isDarkMode: boolean` - Modo oscuro activo
- `hoverStyles: React.CSSProperties` - Estilos de hover

### **SubscriptionSection.tsx**
Formulario de suscripción por email (solo usuarios no autenticados).

**Props:** Ninguna

### **NewsSkeleton.tsx**
Estado de carga con animaciones de pulse.

**Props:** Ninguna

## 🎣 Hooks

### **useNoticias(activeTab)**
Gestiona la carga de noticias con React Query.

**Parámetros:**
- `activeTab: TabType` - Tipo de noticias a cargar

**Retorna:**
```typescript
{
  noticias: Noticia[],
  ultimasNoticias: Noticia[],
  loading: boolean,
  isLoadingNoticias: boolean,
  isLoadingUltimas: boolean,
  isErrorNoticias: boolean
}
```

### **useNewsTicker()**
Gestiona los mensajes del ticker.

**Retorna:**
```typescript
{
  messages: TickerMessage[],
  isLoading: boolean
}
```

### **useThemeDetection()**
Detecta el modo oscuro/claro.

**Retorna:**
```typescript
isDarkMode: boolean
```

## 📦 Constantes

### **CACHE_TIME**
Tiempo de caché de React Query (5 minutos).

### **CATEGORIAS_PREDEFINIDAS**
Array de categorías con nombre y color.

### **MENSAJES_TICKER_DEFAULT**
Mensajes predeterminados del ticker.

### **MENSAJES_TICKER_ERROR**
Mensajes de respaldo en caso de error.

## 🔧 Tipos

### **Noticia**
```typescript
interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  vistas: number;
  created_at: string;
  autor_nombre?: string;
  autor_avatar?: string;
  autor_color?: string;
  votos?: number;
  comentarios_count?: number;
  mi_voto?: number | null;
  categorias?: {...}[];
}
```

### **TickerMessage**
```typescript
interface TickerMessage {
  id: string;
  mensaje: string;
  activo: boolean;
  orden: number;
  noticia_id?: string | null;
  noticia?: {...} | null;
}
```

### **TabType**
```typescript
type TabType = "destacadas" | "recientes" | "populares";
```

## 🚀 Características

- ✅ **Modular**: Componentes pequeños y reutilizables
- ✅ **Performante**: React Query con caché de 5 minutos
- ✅ **Responsive**: Diseño adaptable a móviles y desktop
- ✅ **Accesible**: Navegación por teclado y semántica correcta
- ✅ **Temas**: Soporte para modo oscuro/claro
- ✅ **Colores personalizados**: Usa el color del usuario
- ✅ **Animaciones**: Transiciones suaves y marquesina
- ✅ **Skeleton**: Estado de carga elegante

## 📝 Ejemplo de Uso Completo

```tsx
import NoticiasDestacadas from "@/components/home/NoticiasDestacadas";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-4">
      <NoticiasDestacadas className="mb-24" />
      {/* Resto del contenido */}
    </main>
  );
}
```

## 🧪 Testing

Cada componente puede testearse de forma independiente:

```tsx
// Ejemplo: NewsHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewsHeader } from './NewsHeader';

test('cambia de pestaña al hacer click', () => {
  const handleChange = jest.fn();
  render(
    <NewsHeader 
      activeTab="destacadas" 
      onTabChange={handleChange}
      userColor="#3b82f6"
    />
  );
  
  fireEvent.click(screen.getByText('Recientes'));
  expect(handleChange).toHaveBeenCalledWith('recientes');
});
```

## 🔄 Migración desde Componente Antiguo

El componente es **100% compatible** con el anterior. No se requieren cambios en código existente.

**Antes:**
```tsx
import NoticiasDestacadas from "@/components/home/NoticiasDestacadas";
```

**Después:**
```tsx
import NoticiasDestacadas from "@/components/home/NoticiasDestacadas";
// ¡Mismo import! El archivo re-exporta el componente refactorizado
```

## 📚 Documentación Adicional

Ver `REFACTORIZACION_NOTICIAS_DESTACADAS.md` en la raíz del proyecto para más detalles sobre la refactorización.
