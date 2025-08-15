/**
 * Utilidades para el manejo de avatares y fallbacks
 */

/**
 * Extrae las iniciales de un nombre de usuario para usar como fallback en avatares
 * @param username Nombre de usuario del que extraer iniciales
 * @param numChars Número de caracteres a extraer (por defecto 1)
 * @param defaultChar Carácter por defecto si no hay username o está vacío
 * @returns Iniciales en mayúscula
 */
export function getUserInitials(
  username: string | null | undefined,
  numChars: number = 1,
  defaultChar: string = '?'
): string {
  if (!username) return defaultChar;
  
  // Eliminar espacios al inicio y final
  const trimmedUsername = username.trim();
  if (!trimmedUsername) return defaultChar;
  
  // Si se solicitan 2 caracteres y hay un espacio, tomar la primera letra de cada palabra
  if (numChars > 1 && trimmedUsername.includes(' ')) {
    const parts = trimmedUsername.split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
  }
  
  // Si no hay espacio o solo se quiere 1 carácter, tomar los primeros N caracteres
  return trimmedUsername.substring(0, numChars).toUpperCase();
}

/**
 * Genera un color de fondo para el avatar basado en el nombre de usuario
 * @param username Nombre de usuario
 * @returns Color en formato hexadecimal
 */
export function getAvatarColor(username: string | null | undefined): string {
  if (!username) return '#6E56CF'; // Color por defecto
  
  // Generar un hash simple del username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convertir a color hexadecimal
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}
