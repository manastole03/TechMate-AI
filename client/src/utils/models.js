export const MODELS = [
  {
    id: 'gpt-5',
    label: 'GPT-5',
    speed: 'Fast',
    reasoning: 'Advanced',
    creativity: 'High',
    engine: 'anthropic/claude-3.5-sonnet:latest', // simulated mapping
  },
  {
    id: 'claude-35',
    label: 'Claude 3.5',
    speed: 'Fast',
    reasoning: 'Excellent',
    creativity: 'Medium',
    engine: 'anthropic/claude-3.5-sonnet:latest',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    speed: 'Fast',
    reasoning: 'Strong',
    creativity: 'High',
    engine: 'google/gemini-flash-1.5',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    speed: 'Medium',
    reasoning: 'Good',
    creativity: 'Medium',
    engine: 'mistralai/mistral-7b-instruct',
  },
  {
    id: 'llama-3',
    label: 'Llama 3',
    speed: 'Fast',
    reasoning: 'Good',
    creativity: 'Medium',
    engine: 'meta-llama/llama-3.3-70b-instruct:free',
  },
];

export const DEFAULT_MODEL_ID = 'llama-3';

export function getModelInfo(id) {
  return MODELS.find((m) => m.id === id) || MODELS.find((m) => m.id === DEFAULT_MODEL_ID);
}