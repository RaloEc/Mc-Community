import React from "react";
import Image from "next/image";

interface AvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const sizePixels = sizeMap[size];

  return (
    <Image
      src={src}
      alt={alt}
      width={sizePixels}
      height={sizePixels}
      className={`rounded-full object-cover ${className}`}
    />
  );
};
