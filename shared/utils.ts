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
 * Simple hash function for generating stable IDs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a deterministic location ID from full path
 * Uses hash of complete lineage for stability
 */
export function generateLocationId(type: string, slug: string, parentPath: string[] = []): string {
  // Build full path including this location
  const fullPath = [...parentPath, slug].join('/');
  // Hash the full path for deterministic but collision-free IDs
  const hash = simpleHash(fullPath);
  return `loc-${type}-${hash}`;
}
