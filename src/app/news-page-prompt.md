# 📰 Prompt: Página de Noticias Profesional - React + Next.js + TypeScript

Crea una página de noticias completa y profesional con las siguientes especificaciones:

---

## 🎨 DISEÑO VISUAL

### Header
```
- Fondo: gradiente azul (from-blue-600 to-blue-700)
- Título: "Noticias" - text-4xl (móvil), text-5xl (desktop)
- Subtítulo: "Las historias más relevantes de hoy" - text-blue-100
- Padding: py-8 px-4
- Sombra: shadow-lg
- Max width: max-w-7xl mx-auto
```

### Tarjetas de Noticias (NewsCard)
```
Estructura:
- Contenedor: bg-white rounded-xl shadow-md hover:shadow-xl
- Transiciones: transition-all duration-300
- Cursor: cursor-pointer

Imagen:
- Altura: h-48 (normal), h-80 (destacadas)
- Hover: scale-105 en imagen
- Badge categoría: esquina superior izquierda, bg-blue-600, text-xs
- Badge "Destacada": esquina superior derecha, bg-yellow-500, con ícono TrendingUp

Contenido (padding p-5):
- Título: font-bold, text-lg (normal), text-2xl (destacadas)
- Título hover: text-blue-600
- Resumen: text-gray-600, text-sm, line-clamp-2
- Espaciado: mb-2 título, mb-4 resumen

Footer:
- Layout: flex items-center justify-between
- Tamaño: text-sm text-gray-500
- Autor: ícono User + nombre
- Fecha: ícono Calendar + fecha formateada
```

### Noticias Destacadas
```
- Grid especial: Las destacadas ocupan md:col-span-2 md:row-span-2
- Máximo 5 noticias destacadas
- Título de sección: text-3xl font-bold con ícono TrendingUp amarillo
- Espaciado: mb-12
```

### Filtros Desktop (FiltersBar)
```
Contenedor:
- Display: hidden md:block
- Fondo: bg-white rounded-xl shadow-md p-6
- Espaciado: mb-6

Grid de filtros:
- Layout: grid grid-cols-1 md:grid-cols-4 gap-4

Input de búsqueda:
- Ícono Search a la izquierda (absolute left-3)
- Placeholder: "Buscar noticias..."
- Padding: pl-10 pr-4 py-2
- Border: border-gray-300 rounded-lg
- Focus: focus:ring-2 focus:ring-blue-500

Selectores (Categoría, Autor, Ordenamiento):
- Padding: px-4 py-2
- Border: border-gray-300 rounded-lg
- Focus: focus:ring-2 focus:ring-blue-500

Botón "Limpiar":
- Condición: Solo visible si hay filtros activos
- Estilo: bg-gray-100 hover:bg-gray-200
- Ícono X + texto "Limpiar"
```

### Filtros Móvil (FiltersModal + FloatingFilterButton)
```
Botón Flotante:
- Position: fixed bottom-6 right-6
- Display: md:hidden
- Estilo: bg-blue-600 p-4 rounded-full shadow-lg
- Z-index: z-40
- Hover: hover:bg-blue-700 hover:scale-110
- Badge activo: círculo rojo con "!" en absolute -top-1 -right-1

Modal:
- Backdrop: fixed inset-0 bg-black bg-opacity-50
- Contenedor: absolute bottom-0 left-0 right-0
- Estilo: bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto
- Z-index: z-50

Header del modal (sticky):
- Border: border-b border-gray-200
- Layout: flex items-center justify-between
- Título: text-xl font-bold
- Botón cerrar: ícono X con hover:bg-gray-100

Filtros apilados:
- Padding: p-4
- Espaciado: space-y-4
- Labels: text-sm font-medium text-gray-700 mb-2
- Inputs: py-3 (más grandes que desktop)

Botones finales:
- Layout: flex gap-3 pt-4
- Limpiar: flex-1 bg-gray-100 hover:bg-gray-200
- Aplicar: flex-1 bg-blue-600 hover:bg-blue-700 text-white
```

### Grid de Noticias (NewsGrid)
```
- Layout: grid auto-rows-fr gap-6
- Columnas responsivas:
  * Móvil: grid-cols-1
  * Tablet: md:grid-cols-2
  * Desktop: lg:grid-cols-3
```

### Selector de Vista
```
Layout superior:
- Flex: flex items-center justify-between mb-6

Botones:
- Activo: bg-blue-600 text-white
- Inactivo: bg-white text-gray-700 hover:bg-gray-100
- Estilo: px-4 py-2 rounded-lg font-medium transition-colors

Contador:
- Texto: text-sm text-gray-600
- Formato: "{X} noticias" o "{X} noticia"
```

### Secciones por Categoría
```
Header:
- Layout: flex items-center justify-between mb-6
- Título: text-2xl font-bold text-gray-900
- Botón "Ver más": text-blue-600 hover:text-blue-700
  * Ícono ChevronDown rotado -90deg

Contenido:
- Mostrar máximo 3 noticias por categoría
- Usar NewsGrid component
```

### Scroll Infinito
```
Indicador de carga:
- Layout: flex justify-center items-center py-8
- Spinner: animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600
- Texto: "Cargando más noticias..." ml-3 text-gray-600

Mensaje final:
- Layout: text-center py-8 text-gray-500
- Ícono Clock: size-24 mx-auto mb-2 opacity-50
- Texto: "Has llegado al final de las noticias"
```

### Estados Especiales
```
Loading:
- Spinner centrado: h-12 w-12 border-b-2 border-blue-600
- Texto: "Cargando noticias..."
- Padding: py-12

Error:
- Contenedor: bg-red-50 border border-red-200 rounded-xl p-6
- Texto: text-red-800 font-medium text-center
- Role: role="alert"
```

---

## ⚙️ FUNCIONALIDADES

### 1. Sistema de Filtros
```typescript
interface Filters {
  search: string;      // Búsqueda en título y resumen (toLowerCase)
  author: string;      // Filtro exacto por autor
  category: string;    // Filtro exacto por categoría
  sortBy: 'date-desc' | 'date-asc' | 'trending';
}

// Lógica de filtrado:
1. Filtrar por search (incluir título y resumen)
2. Filtrar por category (si no está vacío)
3. Filtrar por author (si no está vacío)
4. Ordenar según sortBy:
   - date-desc: new Date(b.date) - new Date(a.date)
   - date-asc: new Date(a.date) - new Date(b.date)
   - trending: priorizar featured, luego por fecha desc
```

### 2. Scroll Infinito
```typescript
// Configuración:
const ITEMS_PER_PAGE = 9;
const [page, setPage] = useState(1);
const [isLoadingMore, setIsLoadingMore] = useState(false);

// Lógica useEffect:
- Detectar scroll cuando faltan 500px para el final
- Solo activo en viewMode === 'all'
- Delay de 800ms antes de incrementar página
- Calcular: paginatedNews = filteredNews.slice(0, page * ITEMS_PER_PAGE)
- hasMoreNews = paginatedNews.length < filteredNews.length

// Reset página:
- Al cambiar filters
- Al cambiar viewMode
```

### 3. Dos Modos de Vista
```typescript
type ViewMode = 'all' | 'sections';

// Vista "all":
- Mostrar paginatedNews en NewsGrid
- Scroll infinito activo
- Indicadores de carga

// Vista "sections":
- Sección FeaturedNews primero
- Luego CategorySection por cada categoría
- Sin scroll infinito
- Filtrar noticias no-featured para categorías
```

---

## 🗂️ ESTRUCTURA DE COMPONENTES

### Interfaces TypeScript
```typescript
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  image: string;        // URL de Unsplash
  author: string;
  date: string;         // Formato: "2025-09-30"
  category: string;
  featured?: boolean;   // Máximo 3-5 noticias
}

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

interface FiltersBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClear: () => void;
  categories: string[];
  authors: string[];
}

interface FiltersModalProps {
  isOpen: boolean;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClose: () => void;
  onClear: () => void;
  categories: string[];
  authors: string[];
}
```

### Componentes a Crear
```
1. Header - memo() - Sin props
2. NewsCard - memo<NewsCardProps>()
3. FiltersBar - memo<FiltersBarProps>()
4. FiltersModal - memo<FiltersModalProps>()
5. FloatingFilterButton - memo<{ onClick, hasActiveFilters }>()
6. NewsGrid - memo<{ news: NewsArticle[] }>()
7. FeaturedNews - memo<{ news: NewsArticle[] }>()
8. CategorySection - memo<{ category: string, news: NewsArticle[] }>()
9. LoadingIndicator - memo() - Sin props
10. ErrorMessage - memo<{ message: string }>()
```

### Estado Principal (NewsPage)
```typescript
const [filters, setFilters] = useState<Filters>({
  search: '',
  author: '',
  category: '',
  sortBy: 'date-desc'
});

const [isModalOpen, setIsModalOpen] = useState(false);
const [viewMode, setViewMode] = useState<'all' | 'sections'>('all');
const [page, setPage] = useState(1);
const [isLoadingMore, setIsLoadingMore] = useState(false);

// Memoizaciones:
const categories = useMemo(() => 
  Array.from(new Set(MOCK_NEWS.map(n => n.category))).sort(), []
);

const authors = useMemo(() => 
  Array.from(new Set(MOCK_NEWS.map(n => n.author))).sort(), []
);

const filteredNews = useMemo(() => {
  // Aplicar todos los filtros y ordenamiento
}, [filters]);

const paginatedNews = useMemo(() => 
  filteredNews.slice(0, page * ITEMS_PER_PAGE), 
  [filteredNews, page]
);

const featuredNews = useMemo(() => 
  filteredNews.filter(n => n.featured).slice(0, 5),
  [filteredNews]
);

const newsByCategory = useMemo(() => {
  const grouped: Record<string, NewsArticle[]> = {};
  categories.forEach(cat => {
    grouped[cat] = filteredNews.filter(n => 
      n.category === cat && !n.featured
    );
  });
  return grouped;
}, [filteredNews, categories]);
```

---

## 📦 DATOS DE MUESTRA

Crear array `MOCK_NEWS` con 12 noticias:

```typescript
const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Avances revolucionarios en inteligencia artificial...',
    summary: 'Nuevos modelos de IA demuestran capacidades...',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    author: 'María González',
    date: '2025-10-01',
    category: 'Tecnología',
    featured: true
  },
  // ... 11 noticias más
];
```

### Especificaciones:
- **IDs**: Strings del '1' al '12'
- **Títulos**: Descriptivos, 10-15 palabras
- **Resúmenes**: 15-20 palabras, terminan en "..."
- **Imágenes**: URLs de Unsplash relacionadas (tech, science, business, etc.)
- **Autores**: 4-5 autores diferentes (María González, Carlos Ramírez, Ana Martínez, Luis Fernández, Elena Torres, Dr. Roberto Silva)
- **Fechas**: Rango del 2025-09-20 al 2025-10-01
- **Categorías**: Tecnología, Ciencia, Economía, Cultura, Salud, Deportes, Educación
- **Featured**: Exactamente 3 noticias marcadas como featured

---

## 🎯 OPTIMIZACIÓN Y BUENAS PRÁCTICAS

### Memoización
```typescript
// Componentes presentacionales:
const NewsCard = memo<NewsCardProps>(({ article, featured }) => { ... });
NewsCard.displayName = 'NewsCard';

// Callbacks costosos:
const handleClearFilters = useCallback(() => {
  setFilters({ search: '', author: '', category: '', sortBy: 'date-desc' });
}, []);

// Cálculos costosos:
const filteredNews = useMemo(() => { ... }, [filters]);
```

### TypeScript
```typescript
// Tipos estrictos en todas las props
// Interfaces para todos los objetos
// Type guards donde sea necesario
// Evitar 'any' completamente
```

### Accesibilidad
```html
<!-- Roles semánticos -->
<article role="article" aria-label={article.title}>
<header>
<main>

<!-- Estados de carga -->
<div role="status" aria-live="polite">

<!-- Botones -->
<button aria-label="Abrir filtros">
<button aria-label="Cerrar filtros">
<button aria-label="Limpiar filtros">

<!-- Inputs -->
<input aria-label="Buscar noticias">
<select aria-label="Filtrar por categoría">

<!-- Time elements -->
<time dateTime={article.date}>
```

### Rendimiento
```typescript
// Imágenes lazy loading
<img loading="lazy" />

// useMemo para filtros y ordenamiento
// useCallback para handlers
// memo() para componentes puros

// Evitar re-renders innecesarios
// Scroll throttling implícito con setTimeout
```

---

## 📱 RESPONSIVIDAD DETALLADA

### Breakpoints Tailwind
```
sm: 640px   - No usado en este diseño
md: 768px   - Tablet y filtros desktop
lg: 1024px  - 3 columnas en grid
xl: 1280px  - No usado específicamente
```

### Adaptaciones por Componente

**Header:**
```
- text-4xl md:text-5xl (título)
- py-8 px-4 (consistente)
```

**NewsCard:**
```
- Siempre 1 columna en su contenedor
- h-48 normal, h-80 featured
- text-lg normal, text-2xl featured
```

**Filtros:**
```
Desktop (md:):
- hidden md:block
- grid-cols-1 md:grid-cols-4

Móvil:
- Botón flotante: md:hidden
- Modal: Solo se renderiza si isOpen
```

**NewsGrid:**
```
grid-cols-1           // Móvil: 1 columna
md:grid-cols-2        // Tablet: 2 columnas
lg:grid-cols-3        // Desktop: 3 columnas
```

**Featured en grid:**
```
// Solo en desktop:
md:col-span-2 md:row-span-2
```

**Main container:**
```
max-w-7xl mx-auto px-4 py-8
```

---

## 🎨 PALETA DE COLORES COMPLETA

### Azules (Primarios)
```
bg-blue-600        - Botones activos, badges categoría
bg-blue-700        - Gradiente header, hover botones
text-blue-600      - Hover títulos, links
text-blue-700      - Hover links
text-blue-100      - Subtítulo header
focus:ring-blue-500 - Focus states
```

### Grises (Texto y fondos)
```
bg-gray-50         - Fondo página
bg-gray-100        - Botón limpiar, hover inactivo
bg-gray-200        - Placeholder imágenes, hover limpiar
text-gray-900      - Títulos principales
text-gray-700      - Texto labels, botones inactivos
text-gray-600      - Resúmenes, contador
text-gray-500      - Metadatos (autor, fecha)
text-gray-400      - Íconos en inputs
border-gray-300    - Borders inputs
border-gray-200    - Border header modal
```

### Blancos
```
bg-white           - Tarjetas, filtros, modal
text-white         - Texto en botones azules, badges
```

### Amarillos (Destacadas)
```
bg-yellow-500      - Badge "Destacada"
text-yellow-500    - Ícono TrendingUp en sección
```

### Rojos (Errores y alertas)
```
bg-red-50          - Fondo mensaje error
bg-red-500         - Badge filtros activos
text-red-800       - Texto error
border-red-200     - Border mensaje error
```

### Negros (Overlays)
```
bg-black bg-opacity-50  - Backdrop modal
```

---

## ✨ ANIMACIONES Y TRANSICIONES

### Clases de transición
```css
transition-all duration-300      // Tarjetas, botones generales
transition-transform duration-300 // Zoom imágenes
transition-colors               // Cambios de color
```

### Efectos hover
```css
hover:shadow-xl          // Tarjetas
hover:scale-105          // Imágenes dentro tarjetas
hover:scale-110          // Botón flotante
hover:text-blue-600      // Títulos
hover:bg-blue-700        // Botones azules
hover:bg-gray-100        // Botones grises/blancos
hover:bg-gray-200        // Botón limpiar
```

### Animaciones especiales
```css
animate-spin             // Spinners de carga
```

### Transforms
```css
transform -translate-y-1/2  // Centrar íconos en inputs
rotate-[-90deg]            // Flecha "Ver más"
```

---

## 🔌 ÍCONOS (lucide-react)

Importar y usar:
```typescript
import { 
  Search,        // Input búsqueda
  Filter,        // Botón flotante
  X,            // Cerrar modal, limpiar
  ChevronDown,  // "Ver más" (rotar -90deg)
  Calendar,     // Fecha noticias
  User,         // Autor noticias
  TrendingUp,   // Destacadas
  Clock         // Final scroll
} from 'lucide-react';

// Tamaños:
<Search size={20} />      // Inputs
<Filter size={24} />      // Botón flotante
<TrendingUp size={14} />  // Badge pequeño
<TrendingUp size={32} />  // Título sección
<Clock size={24} />       // Final scroll
```

---

## 🚀 CÓDIGO DE REFERENCIA

### Formato de fecha
```typescript
new Date(article.date).toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})
// Resultado: "1 oct 2025"
```

### Detección de filtros activos
```typescript
const hasActiveFilters = 
  filters.search || 
  filters.author || 
  filters.category || 
  filters.sortBy !== 'date-desc';
```

### Scroll infinito useEffect
```typescript
React.useEffect(() => {
  if (viewMode !== 'all') return;

  const handleScroll = () => {
    if (isLoadingMore || !hasMoreNews) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500;

    if (scrollPosition >= threshold) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 800);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [viewMode, isLoadingMore, hasMoreNews]);
```

### Reset de página
```typescript
React.useEffect(() => {
  setPage(1);
}, [filters, viewMode]);
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Estructura base
- [ ] Crear interfaces TypeScript
- [ ] Definir array MOCK_NEWS (12 noticias)
- [ ] Configurar estado principal en NewsPage
- [ ] Implementar memoizaciones (categories, authors, filteredNews)

### Componentes visuales
- [ ] Header con gradiente
- [ ] NewsCard con imagen y badges
- [ ] NewsGrid responsivo
- [ ] FeaturedNews con diseño especial
- [ ] CategorySection con "Ver más"

### Sistema de filtros
- [ ] FiltersBar para desktop
- [ ] FiltersModal para móvil
- [ ] FloatingFilterButton con badge
- [ ] Lógica de filtrado en useMemo
- [ ] Función handleClearFilters

### Funcionalidades avanzadas
- [ ] Scroll infinito con useEffect
- [ ] Paginación de noticias
- [ ] Selector de vista (all/sections)
- [ ] Indicadores de carga
- [ ] Mensaje de error para sin resultados

### Optimización
- [ ] memo() en todos los componentes
- [ ] useMemo para cálculos costosos
- [ ] useCallback para handlers
- [ ] displayName en todos los componentes memoizados

### Accesibilidad
- [ ] Roles ARIA (article, main, header, status, alert)
- [ ] aria-label en botones e inputs
- [ ] aria-live en loading states
- [ ] Navegación por teclado funcional

### Responsividad
- [ ] Grid 1/2/3 columnas según breakpoint
- [ ] Filtros desktop (md:block) y móvil (md:hidden)
- [ ] Tamaños de texto adaptables
- [ ] Featured cards con span correcto en desktop

### Detalles finales
- [ ] Transiciones suaves en todos los elementos
- [ ] Hover states apropiados
- [ ] Loading lazy en imágenes
- [ ] Contador de noticias
- [ ] Mensaje final de scroll

---

## 🎯 RESULTADO ESPERADO

Una página completamente funcional que:
- ✅ Se ve profesional y moderna
- ✅ Funciona perfectamente en móvil, tablet y desktop
- ✅ Permite filtrar y buscar noticias fluidamente
- ✅ Carga más noticias automáticamente con scroll
- ✅ Tiene dos vistas: lista completa y por secciones
- ✅ Muestra estados de carga y error apropiados
- ✅ Es completamente accesible
- ✅ Tiene código limpio, tipado y optimizado
- ✅ Sigue todas las mejores prácticas de React/Next.js

---

## 💡 NOTAS ADICIONALES

### Para integración en Next.js real:
```typescript
// app/noticias/page.tsx
import NewsPage from '@/components/NewsPage';

export default function NoticiasPage() {
  return <NewsPage />;
}

// ISR (opcional):
export const revalidate = 300; // 5 minutos
```

### Para conectar con API real:
```typescript
// Reemplazar MOCK_NEWS con:
const { data, isLoading, error } = useQuery({
  queryKey: ['news', filters],
  queryFn: () => fetchNews(filters)
});
```

### Dependencias necesarias:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0",
    "lucide-react": "^0.263.1"
  }
}
```