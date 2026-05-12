/**
 * Curation scoring — thresholds, trust scores, and rejection logic
 */
import type { CurationResult } from '../types.js';

/** Articles below these thresholds are rejected */
export const THRESHOLDS = {
  canadianRelevance: 70,
  accountabilityValue: 60,
  missionAlignment: 60,
};

/**
 * Calculate weighted trust score from curation dimensions
 */
export function calculateTrustScore(result: CurationResult): number {
  const weights = {
    canadianRelevance: 0.35,
    accountabilityValue: 0.30,
    missionAlignment: 0.20,
    sourceQuality: 0.10,
    urgency: 0.05,
  };

  return Math.round(
    result.canadianRelevance * weights.canadianRelevance +
    result.accountabilityValue * weights.accountabilityValue +
    result.missionAlignment * weights.missionAlignment +
    result.sourceQuality * weights.sourceQuality +
    result.urgency * weights.urgency
  );
}

/**
 * Check if an article passes all threshold gates
 */
export function evaluateThresholds(result: CurationResult): boolean {
  return (
    result.canadianRelevance >= THRESHOLDS.canadianRelevance &&
    result.accountabilityValue >= THRESHOLDS.accountabilityValue &&
    result.missionAlignment >= THRESHOLDS.missionAlignment
  );
}

/**
 * Get safe default curation result when AI analysis fails
 */
export function getDefaultCuration(articleCategory: string): CurationResult {
  return {
    canadianRelevance: 0,
    accountabilityValue: 0,
    missionAlignment: 0,
    sourceQuality: 50,
    urgency: 0,
    totalScore: 0,
    reason: 'AI analysis failed',
    shouldReject: true,
    isBreaking: false,
    category: articleCategory,
  };
}
