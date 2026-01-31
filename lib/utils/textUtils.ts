/**
 * Convert string to snake_case format
 * Handles spaces, special characters, and multiple words
 *
 * @param str - The string to convert
 * @returns The snake_case formatted string
 *
 * @example
 * toSnakeCase("3D Printing") // "3d_printing"
 * toSnakeCase("Technology & News") // "technology_news"
 * toSnakeCase("  Extra Spaces  ") // "extra_spaces"
 */
export function toSnakeCase(str: string): string {
  return str
    .toLowerCase()                 // Convert to lowercase
    .replace(/\s+/g, '_')          // Spaces → underscores
    .replace(/[^\w_]/g, '_')       // Special chars → underscores
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_|_$/g, '')         // Trim leading/trailing underscores
}
