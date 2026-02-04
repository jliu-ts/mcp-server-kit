/**
 * Make.com Integration
 *
 * @example
 * ```typescript
 * import { MakeClient, createMakeTools } from '@trendingsociety/integrations/make'
 *
 * const client = new MakeClient({
 *   apiKey: process.env.MAKE_API_KEY,
 *   teamId: 12345, // Optional default team
 * })
 * const tools = createMakeTools(client)
 *
 * // List scenarios
 * const result = await tools.make_list_scenarios.execute({
 *   isEnabled: true,
 * })
 *
 * // Run a scenario
 * const run = await tools.make_run_scenario.execute({
 *   scenarioId: 67890,
 *   data: { message: 'Hello!' },
 * })
 * ```
 */

export { MakeClient, type MakeClientConfig } from './client.js'
export { createMakeTools, type MakeTools } from './tools.js'
export {
  // Schemas
  ListScenariosInputSchema,
  GetScenarioInputSchema,
  RunScenarioInputSchema,
  ToggleScenarioInputSchema,
  ListConnectionsInputSchema,
  ListOrganizationsInputSchema,
  // Types
  type MakeConfig,
  type Organization,
  type Team,
  type Scenario,
  type ScenarioRun,
  type Connection,
} from './types.js'
