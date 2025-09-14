import { useAuth } from '@/context/AuthContext';

export function useUserTheme() {
  const { profile } = useAuth();
  
  // Color por defecto si no hay perfil o color definido
  const defaultColor = '#2563eb'; // blue-600
  const userColor = profile?.color || defaultColor;
  
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

  return {
    userColor,
    getTextColor,
    getBgColor,
    getHoverTextColor,
    getBorderColor,
    getRingColor,
    // Clases de utilidad comunes
    textColor: `text-[${userColor}]`,
    hoverTextColor: `hover:text-[${userColor}]`,
    borderColor: `border-[${userColor}]`,
    hoverBorderColor: `hover:border-[${userColor}]`,
    bgColor: `bg-[${userColor}]`,
    hoverBgColor: `hover:bg-[${userColor}]`,
    // Clases para modo oscuro
    darkTextColor: `dark:text-[${userColor}]`,
    darkHoverTextColor: `dark:hover:text-[${userColor}]`,
    darkBorderColor: `dark:border-[${userColor}]`,
    darkHoverBorderColor: `dark:hover:border-[${userColor}]`,
  };
}
