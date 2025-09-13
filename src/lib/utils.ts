import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExcerpt(text: string, length: number = 100): string {
  if (!text) return '';
  
  // Remove HTML tags and trim whitespace
  const plainText = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  
  if (plainText.length <= length) return plainText;
  
  // Truncate to the last space before the max length
  return plainText.substring(0, plainText.lastIndexOf(' ', length)) + '...';
}
