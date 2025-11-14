"use client";

import { useMemo } from "react";
import { Avatar } from "@nextui-org/react";
import { normalizeAvatarUrl } from "@/lib/utils/avatar-utils";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
  borderColor?: string;
}

const generateColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generar un color en el rango de azules/verdes/morados
  // Evitamos rojos/naranjas para mejor contraste con texto blanco
  const h = Math.abs(hash) % 270; // 0-270 cubre azules, verdes y morados
  return `hsl(${h}, 70%, 40%)`; // Saturación y luminosidad fijas para buen contraste
};

// Obtener iniciales del nombre (máximo 2 caracteres)
const getInitials = (name: string) => {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function UserAvatar({
  username,
  avatarUrl,
  size = "md",
  className = "",
  color,
  borderColor,
}: UserAvatarProps) {
  const initials = getInitials(username || "");
  const avatarColor = useMemo(() => {
    if (color) return color;

    if (!username) return "#3b82f6"; // Color azul predeterminado

    return generateColor(username || "user");
  }, [username, color]);

  // Crear un estilo combinado que incluya tanto el color de fondo como el borde si está definido
  const avatarStyle = {
    backgroundColor: !avatarUrl ? avatarColor : undefined,
    ...(borderColor && { borderColor, borderStyle: "solid" }),
  };

  return (
    <Avatar
      src={normalizeAvatarUrl(avatarUrl) || undefined}
      name={initials}
      size={size}
      className={className}
      style={avatarStyle}
      showFallback
    />
  );
}
