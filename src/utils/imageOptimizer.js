/**
 * Smart Image CDN Optimizer
 * Converts large Unsplash & Cloud images into fast, lightweight, auto-formatted WebP
 */
export function getOptimizedImageUrl(url, width = 800, quality = 80) {
  if (!url || typeof url !== 'string') return url;

  // Handle Unsplash Images
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('w', String(width));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
