import { generateText } from "ai"

// Boilerplate only — no AI features implemented yet.
// To wire up a provider, install e.g. @ai-sdk/anthropic and pass the model:
//   import { anthropic } from "@ai-sdk/anthropic"
//   await generateAIResponse(anthropic("claude-haiku-4-5-20251001"), "Hello")

export async function generateAIResponse(
  model: Parameters<typeof generateText>[0]["model"],
  prompt: string,
): Promise<string> {
  const { text } = await generateText({ model, prompt })
  return text
}
