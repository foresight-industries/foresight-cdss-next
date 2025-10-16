// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { type Tool, tool } from 'ai'
import { z } from 'zod'

type CalculatorTools =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'

export const calculatorTools = (config?: {
  excludeTools?: CalculatorTools[]
}): Partial<Record<CalculatorTools, Tool>> => {
  const tools: Partial<Record<CalculatorTools, Tool>> = {
    add: tool({
      description: 'Add two numbers and return the result',
      parameters: z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      }),
      execute: async ({ a, b }: { a: number; b: number }) => {
        const result = a + b
        return result
      },
    }),

    subtract: tool({
      description: 'Subtract second number from first and return the result',
      parameters: z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      }),
      execute: async ({ a, b }: { a: number; b: number }) => {
        const result = a - b
        return result
      },
    }),

    multiply: tool({
      description: 'Multiply two numbers and return the result',
      parameters: z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      }),
      execute: async ({ a, b }: { a: number; b: number }) => {
        const result = a * b
        return result
      },
    }),

    divide: tool({
      description: 'Divide first number by second and return the result',
      parameters: z.object({
        a: z.number().describe('Numerator'),
        b: z.number().describe('Denominator'),
      }),
      execute: async ({ a, b }: { a: number; b: number }) => {
        if (b === 0) {
          throw new Error('Cannot divide by zero')
        }
        const result = a / b
        return result
      },
    }),
  }

  for (const toolName in tools) {
    if (config?.excludeTools?.includes(toolName as CalculatorTools)) {
      delete tools[toolName as CalculatorTools]
    }
  }

  return tools
}
