// Tiempo de cache en milisegundos (5 minutos)
export const CACHE_TIME = 5 * 60 * 1000;

// Categorías predefinidas
export const CATEGORIAS_PREDEFINIDAS = [
  { nombre: "Actualizaciones", color: "#3b82f6" },
  { nombre: "Eventos", color: "#10b981" },
  { nombre: "Guias", color: "#f59e0b" },
  { nombre: "Comunidad", color: "#8b5cf6" },
  { nombre: "Trucos", color: "#ec4899" },
  { nombre: "Mods", color: "#f43f5e" },
];

// Mensajes predeterminados del ticker
export const MENSAJES_TICKER_DEFAULT = [
  {
    id: "default-1",
    mensaje: "Bienvenido a la comunidad de BitArena",
    activo: true,
    orden: 1,
  },
  {
    id: "default-2",
    mensaje: "¡Únete a nuestros eventos semanales!",
    activo: true,
    orden: 2,
  },
  {
    id: "default-3",
    mensaje: "Explora los últimos mods y texturas",
    activo: true,
    orden: 3,
  },
];

// Mensajes de respaldo en caso de error
export const MENSAJES_TICKER_ERROR = [
  {
    id: "error-1",
    mensaje: "Bienvenido a la comunidad de BitArena",
    activo: true,
    orden: 1,
  },
  {
    id: "error-2",
    mensaje: "¡Únete a nuestros eventos semanales!",
    activo: true,
    orden: 2,
  },
  {
    id: "error-3",
    mensaje: "Explora los últimos mods y texturas",
    activo: true,
    orden: 3,
  },
];
