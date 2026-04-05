const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getFullImageUrl(url: string): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  return `${cleanBaseUrl}${cleanPath}`;
}
