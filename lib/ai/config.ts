/**
 * AI Model Configuration
 *
 * Centralized configuration for AI models used throughout the application.
 * Models are organized by use case and complexity.
 */

export const AI_MODELS = {
  /**
   * Quick model for simple, straightforward tasks
   * - Lowest cost
   * - Fastest response times
   * - Good for basic text generation and simple tasks
   */
  QUICK: 'gpt-4.1-nano',

  /**
   * Standard model for balanced performance
   * - Moderate cost
   * - Good quality responses
   * - Suitable for most tasks
   */
  STANDARD: 'gpt-4.1-mini',

  /**
   * Reasoning model for complex tasks requiring deep thinking
   * - Higher cost
   * - Extended reasoning capabilities
   * - Best for complex problem-solving
   */
  REASONING: 'gpt-5.1',
} as const;

/**
 * Temperature settings for different generation scenarios
 */
export const AI_TEMPERATURE = {
  /**
   * Low creativity - more consistent, focused outputs
   */
  FOCUSED: 0.3,

  /**
   * Balanced creativity and consistency
   */
  BALANCED: 0.7,

  /**
   * High creativity - more variety and unexpected outputs
   */
  CREATIVE: 0.9,

  /**
   * Maximum creativity - highest variety
   */
  MAX_CREATIVE: 1.0,
} as const;

/**
 * Task-specific AI configurations
 */
export const AI_TASKS = {
  QUESTION_GENERATION: {
    model: AI_MODELS.STANDARD,
    temperature: AI_TEMPERATURE.CREATIVE,
    maxTokens: 2000,
    description: 'Generate family Bible study discussion questions',
  },

  QUESTION_REGENERATION: {
    model: AI_MODELS.QUICK,
    temperature: AI_TEMPERATURE.MAX_CREATIVE,
    maxTokens: 1000,
    description: 'Regenerate a single question with feedback',
  },

  SUMMARY_GENERATION: {
    model: AI_MODELS.QUICK,
    temperature: AI_TEMPERATURE.FOCUSED,
    maxTokens: 500,
    description: 'Generate concise session summaries',
  },
} as const;

/**
 * Validation thresholds for quality control
 */
export const AI_VALIDATION = {
  MIN_DIVERSITY_THRESHOLD: 0.6, // 60% unique starting words
} as const;
