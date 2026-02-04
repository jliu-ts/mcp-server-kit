/**
 * Make.com (Integromat) API Types
 * https://www.make.com/en/api-documentation
 */

import { z } from 'zod'

// ============================================================================
// Configuration
// ============================================================================

export interface MakeConfig {
  apiKey: string
  baseUrl?: string
  teamId?: number
  timeout?: number
}

// ============================================================================
// Organizations & Teams
// ============================================================================

export interface Organization {
  id: number
  name: string
  countryId: number
  timezoneId: number
}

export interface Team {
  id: number
  name: string
  organizationId: number
}

// ============================================================================
// Scenarios
// ============================================================================

export interface Scenario {
  id: number
  name: string
  teamId: number
  folderId?: number
  description?: string
  isEnabled: boolean
  isPaused: boolean
  isinvalid: boolean
  usedPackages: string[]
  scheduling?: {
    type: 'immediately' | 'once' | 'interval' | 'cron'
    interval?: number
    date?: string
  }
  createdAt: string
  updatedAt: string
  nextExec?: string
}

export interface ScenarioRun {
  id: number
  scenarioId: number
  status: 'running' | 'success' | 'warning' | 'error' | 'stopped'
  timestamp: string
  duration: number
  operations: number
  transfer: number
}

// ============================================================================
// Connections
// ============================================================================

export interface Connection {
  id: number
  name: string
  accountName: string
  accountType: string
  packageName: string
  teamId: number
  scopes?: string[]
  metadata?: Record<string, unknown>
}

// ============================================================================
// Zod Schemas for Tool Inputs
// ============================================================================

export const ListScenariosInputSchema = z.object({
  teamId: z.number().optional().describe('Team ID to filter scenarios'),
  folderId: z.number().optional().describe('Folder ID to filter scenarios'),
  isEnabled: z.boolean().optional().describe('Filter by enabled status'),
  limit: z.number().max(100).default(50).describe('Maximum scenarios to return'),
})

export const GetScenarioInputSchema = z.object({
  scenarioId: z.number().describe('Scenario ID'),
})

export const RunScenarioInputSchema = z.object({
  scenarioId: z.number().describe('Scenario ID to run'),
  data: z.record(z.unknown()).optional().describe('Input data for the scenario'),
})

export const ToggleScenarioInputSchema = z.object({
  scenarioId: z.number().describe('Scenario ID'),
  enabled: z.boolean().describe('Enable or disable the scenario'),
})

export const ListConnectionsInputSchema = z.object({
  teamId: z.number().optional().describe('Team ID to filter connections'),
  limit: z.number().max(100).default(50).describe('Maximum connections to return'),
})

export const ListOrganizationsInputSchema = z.object({
  limit: z.number().max(100).default(50).describe('Maximum organizations to return'),
})
