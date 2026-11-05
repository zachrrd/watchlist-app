import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidHttpUrl(urlString?: string): boolean {
  if (!urlString) return false;
  const trimmed = urlString.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectPlatform(link?: string): string {
  if (!link || !link.trim()) return 'Others';
  const trimmed = link.trim().toLowerCase();
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname;
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('netflix.com')) return 'Netflix';
    if (host.includes('crunchyroll.com')) return 'Crunchyroll';
    if (host.includes('disneyplus.com') || host.includes('disney.com')) return 'Disney+';
    if (host.includes('primevideo.com') || host.includes('amazon.')) return 'Prime Video';
    if (host.includes('hulu.com')) return 'Hulu';
    if (host.includes('max.com') || host.includes('hbomax.com')) return 'Max';
    return 'Others';
  } catch {
    if (trimmed.includes('youtu')) return 'YouTube';
    if (trimmed.includes('netflix')) return 'Netflix';
    if (trimmed.includes('crunchyroll')) return 'Crunchyroll';
    if (trimmed.includes('disney')) return 'Disney+';
    if (trimmed.includes('prime') || trimmed.includes('amazon')) return 'Prime Video';
    return 'Others';
  }
}
