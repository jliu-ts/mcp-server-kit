/**
 * Make.com AI SDK Tools
 * MCP-compatible tools for Make.com automation
 */

import { tool } from 'ai'
import { MakeClient } from './client.js'
import {
  ListScenariosInputSchema,
  GetScenarioInputSchema,
  RunScenarioInputSchema,
  ToggleScenarioInputSchema,
  ListConnectionsInputSchema,
  ListOrganizationsInputSchema,
} from './types.js'

export function createMakeTools(client: MakeClient) {
  return {
    // ========================================================================
    // Scenarios
    // ========================================================================
    make_list_scenarios: tool({
      description: 'List scenarios (workflows) in Make.com. Filter by team or folder.',
      inputSchema: ListScenariosInputSchema,
      execute: async (params) => {
        const result = await client.listScenarios({
          teamId: params.teamId,
          folderId: params.folderId,
          isEnabled: params.isEnabled,
          pg: { limit: params.limit },
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.scenarios.length,
          scenarios: result.data.scenarios.map((s) => ({
            id: s.id,
            name: s.name,
            enabled: s.isEnabled,
            paused: s.isPaused,
            packages: s.usedPackages,
            nextExec: s.nextExec,
            updatedAt: s.updatedAt,
          })),
        }
      },
    }),

    make_get_scenario: tool({
      description: 'Get detailed information about a specific scenario.',
      inputSchema: GetScenarioInputSchema,
      execute: async (params) => {
        const result = await client.getScenario(params.scenarioId)
        if (!result.success) throw new Error(result.error.message)

        const s = result.data.scenario
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          enabled: s.isEnabled,
          paused: s.isPaused,
          invalid: s.isinvalid,
          packages: s.usedPackages,
          scheduling: s.scheduling,
          nextExec: s.nextExec,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }
      },
    }),

    make_run_scenario: tool({
      description: 'Trigger a scenario to run immediately.',
      inputSchema: RunScenarioInputSchema,
      execute: async (params) => {
        const result = await client.runScenario(params.scenarioId, params.data)
        if (!result.success) throw new Error(result.error.message)

        return {
          executionId: result.data.executionId,
          message: 'Scenario execution started.',
        }
      },
    }),

    make_toggle_scenario: tool({
      description: 'Enable or disable a scenario.',
      inputSchema: ToggleScenarioInputSchema,
      execute: async (params) => {
        const result = params.enabled
          ? await client.enableScenario(params.scenarioId)
          : await client.disableScenario(params.scenarioId)
        if (!result.success) throw new Error(result.error.message)

        return {
          id: result.data.scenario.id,
          name: result.data.scenario.name,
          enabled: result.data.scenario.isEnabled,
        }
      },
    }),

    // ========================================================================
    // Connections
    // ========================================================================
    make_list_connections: tool({
      description: 'List connections (integrations) configured in Make.com.',
      inputSchema: ListConnectionsInputSchema,
      execute: async (params) => {
        const result = await client.listConnections({
          teamId: params.teamId,
          pg: { limit: params.limit },
        })
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.connections.length,
          connections: result.data.connections.map((c) => ({
            id: c.id,
            name: c.name,
            accountName: c.accountName,
            accountType: c.accountType,
            package: c.packageName,
          })),
        }
      },
    }),

    // ========================================================================
    // Organizations
    // ========================================================================
    make_list_organizations: tool({
      description: 'List organizations you have access to in Make.com.',
      inputSchema: ListOrganizationsInputSchema,
      execute: async () => {
        const result = await client.listOrganizations()
        if (!result.success) throw new Error(result.error.message)

        return {
          count: result.data.organizations.length,
          organizations: result.data.organizations.map((o) => ({
            id: o.id,
            name: o.name,
          })),
        }
      },
    }),
  }
}

export type MakeTools = ReturnType<typeof createMakeTools>
