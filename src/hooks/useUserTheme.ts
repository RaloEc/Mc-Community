import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';

// Función para aclarar un color hexadecimal
const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 + 
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

// Función para oscurecer un color hexadecimal
const darkenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;

  return '#' + (
    0x1000000 + 
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

export function useUserTheme() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  
  // Color por defecto si no hay perfil o color definido
  const defaultColor = '#2563eb'; // blue-600
  const userColor = profile?.color || defaultColor;
  
  // Determinar si estamos en modo oscuro o claro
  const isDarkMode = theme === 'dark';
  
  // Ajustar el color según el modo
  const adjustedColor = isDarkMode 
    ? darkenColor(userColor, 10) // Un poco más oscuro en modo oscuro
    : lightenColor(userColor, 10); // Un poco más claro en modo claro
  
  // Genera clases de Tailwind con el color personalizado
  const getTextColor = () => ({
    color: userColor,
    '--tw-text-opacity': 1,
    '--tw-border-opacity': 1,
  });

  const getBgColor = (opacity = 1) => ({
    backgroundColor: `${userColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
  });

  const getHoverTextColor = () => ({
    '--tw-text-opacity': 1,
    '--tw-border-opacity': 1,
    '--tw-hover-text-opacity': 1,
    '--tw-hover-border-opacity': 1,
    '--tw-hover-bg-opacity': 0.1,
    '--tw-hover-bg': userColor,
  });

  const getBorderColor = () => ({
    borderColor: userColor,
    '--tw-border-opacity': 1,
  });

  const getRingColor = () => ({
    '--tw-ring-color': userColor,
    '--tw-ring-opacity': 0.5,
  });

  // Función para obtener el color del borde con opacidad ajustada según el tema
  const getThemeAdjustedBorderColor = (opacity = 1) => {
    return {
      borderColor: `${adjustedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      '--tw-border-opacity': 1,
    };
  };

  // Función para obtener el color de fondo con opacidad ajustada según el tema
  const getThemeAdjustedBgColor = (opacity = 0.1) => {
    return {
      backgroundColor: `${adjustedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    };
  };

  return {
    userColor,
    adjustedColor,
    getTextColor,
    getBgColor,
    getHoverTextColor,
    getBorderColor,
    getRingColor,
    getThemeAdjustedBorderColor,
    getThemeAdjustedBgColor,
    // Clases de utilidad comunes
    textColor: `text-[${userColor}]`,
    hoverTextColor: `hover:text-[${userColor}]`,
    borderColor: `border-[${userColor}]`,
    hoverBorderColor: `hover:border-[${userColor}]`,
    bgColor: `bg-[${userColor}]`,
    hoverBgColor: `hover:bg-[${userColor}]`,
    // Clases para modo oscuro
    darkTextColor: `dark:text-[${adjustedColor}]`,
    darkHoverTextColor: `dark:hover:text-[${adjustedColor}]`,
    darkBorderColor: `dark:border-[${adjustedColor}]`,
    darkHoverBorderColor: `dark:hover:border-[${adjustedColor}]`,
    // Clases con ajuste de tema
    themeAdjustedBorderColor: `border-[${adjustedColor}]`,
    themeAdjustedHoverBorderColor: `hover:border-[${adjustedColor}]`,
  };
}
