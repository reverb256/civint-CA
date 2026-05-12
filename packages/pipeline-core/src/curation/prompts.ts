/**
 * AI curation prompts — the canonical prompts for scoring Canadian content
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

export const INSIGHTS_PROMPT = `Analyze this Canadian news article and provide comprehensive insights.

Provide a JSON response with this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "keyPoints": ["main point 1", "main point 2", "main point 3", "main point 4"],
  "stakeholders": ["affected group 1", "affected group 2", "affected group 3"],
  "implications": ["what this means for X", "what this means for Y"],
  "whatNext": ["likely outcome 1", "likely outcome 2", "what to watch for"],
  "readingTime": estimated_reading_time_in_minutes,
  "complexity": "low|medium|high"
}`;

export const BIAS_ANALYSIS_PROMPT = `Analyze this article for potential bias, framing, and perspective.

Rate from 0-100:
- Bias score: 0 = neutral, 100 = extremely biased
- Confidence: How confident are you in this assessment?

Provide a JSON response with this exact structure:
{
  "overallBias": "left|center-left|center|center-right|right",
  "biasScore": number,
  "confidence": number,
  "framing": {
    "language": ["loaded words", "emotional terms found"],
    "tone": "objective|persuasive|alarmist|etc",
    "perspective": "whose viewpoint is centered"
  },
  "whatMissing": ["perspective not included", "voice not heard"],
  "contextGaps": ["missing background", "omitted facts"],
  "alternativePerspectives": ["viewpoint X would say", "counterargument Y"]
}`;
