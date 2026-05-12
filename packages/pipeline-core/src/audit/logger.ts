/**
 * Audit logger — immutable decision logging for AI transparency
 */
import type { AuditEntry } from '../types.js';

export function createAuditEntry(opts: {
  operation: string;
  model?: string;
  input?: string;
  output?: string;
  confidence?: number;
  userId?: string;
  articleId?: string;
}): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    ...opts,
  };
}
