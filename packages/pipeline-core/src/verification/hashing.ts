/**
 * Citation hashing — SHA-256 verification for content provenance
 */

/**
 * Compute a stable hash of content (simple hash for dedup, not crypto)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a shell verification command for an article URL
 */
export function generateVerifyCommand(url: string, algorithm: string = 'sha256'): string {
  return `echo -n "$(curl -s '${url}')" | ${algorithm}sum`;
}
