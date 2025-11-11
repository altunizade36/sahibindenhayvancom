// Shared utilities for consistent slug and ID generation

/**
 * Normalize a string to a URL-safe slug
 * Handles Turkish characters properly
 */
export function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };

  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Generate a deterministic category ID from slug
 * Ensures stable IDs across regenerations
 */
export function generateCategoryId(slug: string): string {
  // Simple deterministic hash based on slug
  // In production, you might want to use a proper UUID v5 or similar
  return `cat-${slug}`;
}

/**
 * Generate a deterministic location ID from type and slug
 */
export function generateLocationId(type: string, slug: string): string {
  return `loc-${type}-${slug}`;
}
