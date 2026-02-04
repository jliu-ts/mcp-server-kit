/**
 * Pollo.AI Integration
 *
 * @example
 * import { PolloClient, createPolloTools } from '@trendingsociety/integrations/pollo'
 *
 * const pollo = new PolloClient({ apiKey: process.env.POLLO_AI_API_KEY })
 * const tools = createPolloTools(pollo)
 *
 * // Or use client directly
 * const task = await pollo.textToVideo({ prompt: 'A sunset over mountains' })
 * const result = await pollo.waitForCompletion(task.data.taskId)
 * console.log(result.data.videoUrl)
 */

export { PolloClient, type PolloClientConfig } from './client.js'
export { createPolloTools, type PolloTools } from './tools.js'
export * from './types.js'
