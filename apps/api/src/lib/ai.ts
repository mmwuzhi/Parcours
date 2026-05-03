import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { env } from '../env.js'

type LanguageModel = Parameters<typeof streamText>[0]['model']

function buildModel(): LanguageModel {
  switch (env.AI_PROVIDER) {
    case 'openai':
    case 'groq':
    case 'mistral':
    case 'deepseek': {
      const openai = createOpenAI({
        apiKey: env.AI_API_KEY,
        ...(env.AI_BASE_URL ? { baseURL: env.AI_BASE_URL } : {}),
      })
      return openai(env.AI_MODEL)
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: env.AI_API_KEY })
      return anthropic(env.AI_MODEL)
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey: env.AI_API_KEY })
      return google(env.AI_MODEL)
    }
    default: {
      const exhaustive: never = env.AI_PROVIDER
      throw new Error(`Unrecognized AI_PROVIDER: ${exhaustive}`)
    }
  }
}

const model = buildModel()

export function streamAnalysis(
  prompt: string,
  options?: { abortSignal?: AbortSignal },
): ReturnType<typeof streamText> {
  return streamText({ model, prompt, abortSignal: options?.abortSignal })
}
