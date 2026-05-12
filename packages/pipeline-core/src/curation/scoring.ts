/**
 * Curation scoring — trust scores, threshold evaluation, prompts
 */

import type { CurationResult } from '../types.js';

/**
 * Curation prompts for the AI gateway
 */
export const CURATION_PROMPT = `Analyze this article for a Canadian political accountability journalism platform.

Rate 0-100:
1. CANADIAN_RELEVANCE: Direct impact on Canadian politics, sovereignty, economy, or policy (REJECT if <70)
2. ACCOUNTABILITY_VALUE: Exposes corruption, tracks promises, reveals influence operations (REJECT if <60)
3. MISSION_ALIGNMENT: Supports Canadian sovereignty, free speech, institutional accountability (REJECT if <60)
4. SOURCE_QUALITY: Credible, verifiable information
5. URGENCY: Breaking news or time-sensitive

AUTOMATIC REJECTION: Sports, entertainment, lifestyle, foreign news without Canadian angle.

Only respond with valid JSON:
{
  "canadianRelevance": number,
  "accountabilityValue": number,
  "missionAlignment": number,
  "sourceQuality": number,
  "urgency": number,
  "totalScore": number,
  "reason": "Brief explanation",
  "shouldReject": boolean,
  "isBreaking": boolean,
  "category": "politics|business|technology|health|environment|culture|indigenous|energy"
}

REJECT if canadianRelevance < 70 OR accountabilityValue < 60 OR missionAlignment < 60.`;

/**
 * Threshold configuration for curation
 */
export const THRESHOLDS = {
  MIN_CANADIAN_RELEVANCE: 70,
  MIN_ACCOUNTABILITY_VALUE: 60,
  MIN_MISSION_ALIGNMENT: 60,
  MIN_TRUST_SCORE: 60,
  SEMANTIC_DEDUP_WINDOW_HOURS: 6,
} as const;

/**
 * Calculate a trust score from curation dimensions
 */
export function calculateTrustScore(curation: Partial<CurationResult>): number {
  const dimensions = [
    curation.canadianRelevance || 0,
    curation.accountabilityValue || 0,
    curation.missionAlignment || 0,
    curation.sourceQuality || 0,
    (curation.urgency ?? 50),
  ];
  return Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length);
}

/**
 * Evaluate whether an article passes curation thresholds
 */
export function evaluateThresholds(curation: Partial<CurationResult>): { passed: boolean; reason: string } {
  if ((curation.canadianRelevance ?? 0) < THRESHOLDS.MIN_CANADIAN_RELEVANCE) {
    return { passed: false, reason: `Canadian relevance ${curation.canadianRelevance} < ${THRESHOLDS.MIN_CANADIAN_RELEVANCE}` };
  }
  if ((curation.accountabilityValue ?? 0) < THRESHOLDS.MIN_ACCOUNTABILITY_VALUE) {
    return { passed: false, reason: `Accountability value ${curation.accountabilityValue} < ${THRESHOLDS.MIN_ACCOUNTABILITY_VALUE}` };
  }
  if ((curation.missionAlignment ?? 0) < THRESHOLDS.MIN_MISSION_ALIGNMENT) {
    return { passed: false, reason: `Mission alignment ${curation.missionAlignment} < ${THRESHOLDS.MIN_MISSION_ALIGNMENT}` };
  }
  if (curation.shouldReject) {
    return { passed: false, reason: curation.reason || 'Explicitly rejected' };
  }
  return { passed: true, reason: curation.reason || 'Passed all thresholds' };
}

/**
 * Get default curation result for fallback
 */
export function getDefaultCuration(): CurationResult {
  return {
    canadianRelevance: 0,
    accountabilityValue: 0,
    missionAlignment: 0,
    sourceQuality: 50,
    urgency: 0,
    totalScore: 0,
    reason: 'Curation not performed',
    shouldReject: true,
    isBreaking: false,
    category: 'news',
  };
}
