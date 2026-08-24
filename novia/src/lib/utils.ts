import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    icebreaker: '❄️ Icebreaker',
    fun: '😄 Fun',
    values: '💎 Values',
    deep: '🌊 Deep',
    relationship: '💕 Relationship',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    icebreaker: 'bg-blue-100 text-blue-800 border-blue-200',
    fun: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    values: 'bg-purple-100 text-purple-800 border-purple-200',
    deep: 'bg-teal-100 text-teal-800 border-teal-200',
    relationship: 'bg-pink-100 text-pink-800 border-pink-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
}