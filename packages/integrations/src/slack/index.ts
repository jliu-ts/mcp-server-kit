/**
 * Slack Integration
 *
 * @example
 * import { SlackClient, SlackBlocks, createSlackTools } from '@trendingsociety/integrations/slack'
 *
 * const slack = new SlackClient({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL,
 * })
 *
 * await slack.send('Hello from Jarvis!')
 *
 * // Or use AI SDK tools
 * const tools = createSlackTools(slack)
 */

export { SlackClient, type SlackClientConfig } from './client.js'
export { SlackBlocks } from './types.js'
export * from './types.js'
export { createSlackTools, SendMessageInputSchema, type SlackTools } from './tools.js'
