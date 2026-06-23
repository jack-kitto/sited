/**
 * Generate a prefixed, collision-resistant id, e.g. `site_<uuid>`.
 * Uses Web Crypto (`crypto.randomUUID`), available in the Workers runtime.
 */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
