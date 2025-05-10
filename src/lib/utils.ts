
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to get formatted thumbnail URL
export function getFormattedThumbnailUrl(templateUrl: string, width: number = 320, height: number = 180): string {
  if (!templateUrl) return 'https://picsum.photos/320/180'; // Fallback if no template URL
  return templateUrl.replace('{width}', String(width)).replace('{height}', String(height));
}

