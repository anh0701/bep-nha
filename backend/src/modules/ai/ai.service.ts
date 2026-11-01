import type {
  Content,
  Part,
} from '@google/genai'

import {
  gemini,
  GEMINI_MODEL,
} from '../../config/gemini.js'

import {
  AI_FUNCTION_DECLARATIONS,
  executeAiFunction,
} from './ai.functions.js'

import {
  COOKING_ASSISTANT_PROMPT,
} from './prompts/cooking-assistant.prompt.js'

import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  AiFunctionName,
  AiFunctionResult,
  AiIntent,
} from './ai.types.js'

export type { ChatMessage } from './ai.types.js'

const MAX_FUNCTION_ROUNDS = 5
const MAX_RETRIES = 3

export async function chatWithGemini(
  data: ChatRequest,
): Promise<ChatResponse> {
  // console.log('[AI] Received message:', data.message)

  const history = (data.history ?? []).slice(-10)

  const contents: Content[] = [
    ...history.map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    })),
    {
      role: 'user',
      parts: [{ text: data.message }],
    },
  ]

  return generateWithFunctionCalling(contents)
}

async function generateWithFunctionCalling(
  contents: Content[],
): Promise<ChatResponse> {
  // Lưu kết quả thực tế do backend thực thi.
  const results: AiFunctionResult[] = []

  // Theo dõi các function Gemini đã gọi.
  const usedFunctions = new Set<AiFunctionName>()

  for (
    let round = 0;
    round <= MAX_FUNCTION_ROUNDS;
    round++
  ) {
    // console.log(
    //   `[AI] Starting Gemini request - Round ${round + 1}`,
    // )

    const response = await generateWithRetry(contents)

    // console.log(
    //   `[AI] Gemini responded - Round ${round + 1}`,
    // )

    const functionCalls = response.functionCalls ?? []

    // console.log(
    //   '[AI] Function calls:',
    //   functionCalls.map((call) => call.name),
    // )

    // Không còn function call: Gemini đã tạo câu trả lời cuối.
    if (functionCalls.length === 0) {
      const answer = response.text?.trim()

      // console.log('[AI] Final answer:', answer)

      if (!answer) {
        throw new Error('Gemini returned an empty response')
      }

      let intent: AiIntent = 'chat'

      if (usedFunctions.size === 1) {
        intent = [...usedFunctions][0]
      } else if (usedFunctions.size > 1) {
        intent = 'multiple'
      }

      return {
        message: answer,
        intent,
        results,
      }
    }

    if (round === MAX_FUNCTION_ROUNDS) {
      throw new Error(
        'Gemini exceeded the maximum function calling rounds',
      )
    }

    // Giữ nguyên model content để bảo toàn thought signature.
    const modelContent = response.candidates?.[0]?.content

    if (!modelContent) {
      throw new Error(
        'Gemini returned function calls without candidate content',
      )
    }

    contents.push(modelContent)

    // Thực thi các function song song.
    const executions = await Promise.all(
      functionCalls.map(async (call) => {
        const name = call.name

        if (!name) {
          throw new Error(
            'Gemini returned a function call without a name',
          )
        }

        try {
          const result = await executeAiFunction(
            name,
            call.args ?? {},
          )

          // console.log(
          //   `[AI] Function result: ${name}`,
          //   result,
          // )

          const functionName = name as AiFunctionName

          return {
            part: {
              functionResponse: {
                name,
                response: {
                  result,
                },
                ...(call.id ? { id: call.id } : {}),
              },
            } satisfies Part,

            result: {
              functionName,
              data: result,
            } satisfies AiFunctionResult,
          }
        } catch (error) {
          console.error(
            `[AI Function Error: ${name}]`,
            error,
          )

          return {
            part: {
              functionResponse: {
                name,
                response: {
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Không thể thực hiện chức năng này.',
                },
                ...(call.id ? { id: call.id } : {}),
              },
            } satisfies Part,

            result: null,
          }
        }
      }),
    )

    // Promise.all giữ thứ tự theo functionCalls.
    for (const execution of executions) {
      if (execution.result) {
        results.push(execution.result)
        usedFunctions.add(execution.result.functionName)
      }
    }

    contents.push({
      role: 'user',
      parts: executions.map((execution) => execution.part),
    })
  }

  throw new Error('Gemini function calling failed')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const apiError = error as {
    status?: number
    code?: number
    message?: string
  }

  const status = apiError.status ?? apiError.code

  if ([408, 429, 500, 502, 503, 504].includes(Number(status))) {
    return true
  }

  return /503|UNAVAILABLE|high demand|RESOURCE_EXHAUSTED/i.test(
    apiError.message ?? '',
  )
}

async function generateWithRetry(
  contents: Content[],
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: COOKING_ASSISTANT_PROMPT,
          maxOutputTokens: 1200,
          tools: [
            {
              functionDeclarations: AI_FUNCTION_DECLARATIONS,
            },
          ],
        },
      })
    } catch (error) {
      const apiError = error as {
        status?: number
        code?: number
        message?: string
      }

      const status = apiError.status ?? apiError.code

      console.error('[Gemini API Error]', {
        status,
        message: apiError.message,
        attempt: attempt + 1,
      })

      if (
        !isRetryableError(error) ||
        attempt === MAX_RETRIES
      ) {
        throw error
      }

      const delay = 1000 * 2 ** attempt
      const jitter = Math.random() * 500
      const waitTime = delay + jitter

      console.warn(
        `[Gemini] Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(waitTime)}ms`,
      )

      await sleep(waitTime)
    }
  }

  throw new Error('Gemini request failed after retries')
}