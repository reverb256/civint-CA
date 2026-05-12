/**
 * AI Gateway — connect to Carnice 3090 MoE or any OpenAI-compatible endpoint
 *
 * Handles reasoning models where content may be in reasoning_content field
 * and strips markdown code fences from JSON responses.
 */

export interface AIGatewayConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  /** The assistant's response content (may be empty if reasoning-only output) */
  content: string;
  /** Thinking/reasoning block (Carnice with --reasoning) */
  reasoningContent?: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timings: {
    promptMs: number;
    predictedMs: number;
    predictedPerSecond: number;
  };
}

/**
 * Get usable text content, preferring content field but falling back
 * to reasoning_content for reasoning models.
 */
export function getResponseText(response: AIResponse): string {
  if (response.content && response.content.trim()) {
    return stripMarkdownFences(response.content.trim());
  }
  if (response.reasoningContent && response.reasoningContent.trim()) {
    return stripMarkdownFences(response.reasoningContent.trim());
  }
  return '';
}

/**
 * Strip markdown code fences (```json ... ``` or ``` ... ```) from text
 */
function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();
}

/**
 * Query an OpenAI-compatible API (llama.cpp, vLLM, etc.)
 */
export async function queryAI(
  config: AIGatewayConfig,
  messages: { role: string; content: string }[],
  options?: {
    responseFormat?: { type: string };
    temperature?: number;
    /** Override max tokens. Default 4096 to accommodate reasoning models. */
    maxTokens?: number;
  }
): Promise<AIResponse> {
  const maxTokens = options?.maxTokens ?? config.maxTokens ?? 4096;

  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? config.temperature ?? 0.3,
      max_tokens: maxTokens,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content || '',
    reasoningContent: choice?.reasoning_content,
    model: data.model || config.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    timings: {
      promptMs: data.timings?.prompt_ms || 0,
      predictedMs: data.timings?.predicted_ms || 0,
      predictedPerSecond: data.timings?.predicted_per_second || 0,
    },
  };
}
