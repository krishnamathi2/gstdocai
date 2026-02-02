import OpenAI from "openai";

// Using Perplexity API (OpenAI-compatible)
export const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: "https://api.perplexity.ai",
});
