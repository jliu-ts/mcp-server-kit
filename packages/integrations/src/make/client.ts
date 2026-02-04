/**
 * Make.com (Integromat) API Client
 * https://www.make.com/en/api-documentation
 */

import { type Result, ok, fail, type ClientConfig } from '../types.js'
import type {
  Organization,
  Team,
  Scenario,
  Connection,
} from './types.js'

export interface MakeClientConfig extends ClientConfig {
  apiKey: string
  baseUrl?: string
  teamId?: number
}

export class MakeClient {
  private apiKey: string
  private baseUrl: string
  private teamId?: number
  private timeout: number
  private fetchFn: typeof fetch

  constructor(config: MakeClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://us1.make.com/api/v2'
    this.teamId = config.teamId
    this.timeout = config.timeout ?? 30000
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return fail(
          'MAKE_API_ERROR',
          error.message || `HTTP ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      return ok(data as T)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return fail('TIMEOUT', 'Request timed out', 408)
      }
      return fail(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // ============================================================================
  // Organizations
  // ============================================================================

  async listOrganizations(): Promise<Result<{ organizations: Organization[] }>> {
    return this.request<{ organizations: Organization[] }>('/organizations')
  }

  // ============================================================================
  // Teams
  // ============================================================================

  async listTeams(organizationId: number): Promise<Result<{ teams: Team[] }>> {
    return this.request<{ teams: Team[] }>(
      `/organizations/${organizationId}/teams`
    )
  }

  // ============================================================================
  // Scenarios
  // ============================================================================

  async listScenarios(params?: {
    teamId?: number
    folderId?: number
    isEnabled?: boolean
    pg?: { limit?: number; offset?: number }
  }): Promise<Result<{ scenarios: Scenario[] }>> {
    const teamId = params?.teamId ?? this.teamId
    if (!teamId) {
      return fail('VALIDATION_ERROR', 'teamId is required')
    }

    const searchParams = new URLSearchParams()
    if (params?.folderId) searchParams.set('folderId', String(params.folderId))
    if (params?.isEnabled !== undefined)
      searchParams.set('isEnabled', String(params.isEnabled))
    if (params?.pg?.limit) searchParams.set('pg[limit]', String(params.pg.limit))
    if (params?.pg?.offset) searchParams.set('pg[offset]', String(params.pg.offset))

    const query = searchParams.toString()
    return this.request<{ scenarios: Scenario[] }>(
      `/teams/${teamId}/scenarios${query ? `?${query}` : ''}`
    )
  }

  async getScenario(scenarioId: number): Promise<Result<{ scenario: Scenario }>> {
    return this.request<{ scenario: Scenario }>(`/scenarios/${scenarioId}`)
  }

  async runScenario(
    scenarioId: number,
    data?: Record<string, unknown>
  ): Promise<Result<{ executionId: string }>> {
    return this.request<{ executionId: string }>(`/scenarios/${scenarioId}/run`, {
      method: 'POST',
      body: data ? JSON.stringify({ data }) : undefined,
    })
  }

  async enableScenario(
    scenarioId: number
  ): Promise<Result<{ scenario: Scenario }>> {
    return this.request<{ scenario: Scenario }>(
      `/scenarios/${scenarioId}/enable`,
      { method: 'PATCH' }
    )
  }

  async disableScenario(
    scenarioId: number
  ): Promise<Result<{ scenario: Scenario }>> {
    return this.request<{ scenario: Scenario }>(
      `/scenarios/${scenarioId}/disable`,
      { method: 'PATCH' }
    )
  }

  // ============================================================================
  // Connections
  // ============================================================================

  async listConnections(params?: {
    teamId?: number
    pg?: { limit?: number; offset?: number }
  }): Promise<Result<{ connections: Connection[] }>> {
    const teamId = params?.teamId ?? this.teamId
    if (!teamId) {
      return fail('VALIDATION_ERROR', 'teamId is required')
    }

    const searchParams = new URLSearchParams()
    if (params?.pg?.limit) searchParams.set('pg[limit]', String(params.pg.limit))
    if (params?.pg?.offset) searchParams.set('pg[offset]', String(params.pg.offset))

    const query = searchParams.toString()
    return this.request<{ connections: Connection[] }>(
      `/teams/${teamId}/connections${query ? `?${query}` : ''}`
    )
  }
}
