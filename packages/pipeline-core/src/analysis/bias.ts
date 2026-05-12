/**
 * Bias analysis types and helper functions
 */
import type { BiasAnalysis } from '../types.js';

export function getDefaultBiasAnalysis(): BiasAnalysis {
  return {
    overallBias: 'center',
    biasScore: 0,
    confidence: 0,
    framing: { language: [], tone: 'unknown', perspective: 'unknown' },
    whatMissing: [],
    contextGaps: [],
    alternativePerspectives: [],
  };
}
