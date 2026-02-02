import OpenAI from "openai";

// Using Perplexity API (OpenAI-compatible)
// Lazy initialization to avoid build-time errors
let _perplexity: OpenAI | null = null;

export function getPerplexity(): OpenAI {
  if (!_perplexity) {
    _perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY || "dummy-key-for-build",
      baseURL: "https://api.perplexity.ai",
    });
  }
  return _perplexity;
}

// For backward compatibility
export const perplexity = {
  chat: {
    completions: {
      create: async (...args: Parameters<OpenAI["chat"]["completions"]["create"]>) => {
        return getPerplexity().chat.completions.create(...args);
      },
    },
  },
};
