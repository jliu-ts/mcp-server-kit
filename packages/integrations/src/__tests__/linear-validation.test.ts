/**
 * @trendingsociety/integrations - Linear Validation Tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateIssueParams,
  getLabelsForCategory,
  getAllLabels,
  isValidLabel,
  getLabelCategory,
  suggestLabels,
  formatValidationResult,
  LABEL_TAXONOMY,
} from '../linear/validation.js'

describe('Linear Validation', () => {
  describe('LABEL_TAXONOMY', () => {
    it('should have work type labels', () => {
      expect(LABEL_TAXONOMY.workType).toContain('Feature')
      expect(LABEL_TAXONOMY.workType).toContain('Bug')
      expect(LABEL_TAXONOMY.workType).toContain('Improvement')
    })

    it('should have business unit labels', () => {
      expect(LABEL_TAXONOMY.businessUnit).toContain('publisher')
      expect(LABEL_TAXONOMY.businessUnit).toContain('platform')
      expect(LABEL_TAXONOMY.businessUnit).toContain('agency')
    })

    it('should have domain labels', () => {
      expect(LABEL_TAXONOMY.domain).toContain('database')
      expect(LABEL_TAXONOMY.domain).toContain('api')
      expect(LABEL_TAXONOMY.domain).toContain('auth')
    })

    it('should have infrastructure labels', () => {
      expect(LABEL_TAXONOMY.infrastructure).toContain('mcp')
      expect(LABEL_TAXONOMY.infrastructure).toContain('vercel')
      expect(LABEL_TAXONOMY.infrastructure).toContain('cloudflare')
    })
  })

  describe('validateIssueParams', () => {
    it('should validate complete params', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'database'],
        description: '## Context\n\n## Summary\n\n## Scope\n\n## Acceptance Criteria',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require title', () => {
      const result = validateIssueParams({
        title: '',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'api'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Title is required')
    })

    it('should warn on short title', () => {
      const result = validateIssueParams({
        title: 'Fix bug',
        team: 'Engineering',
        priority: 2,
        labels: ['Bug', 'platform', 'api'],
      })

      expect(result.warnings.some((w) => w.includes('short'))).toBe(true)
    })

    it('should require team', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        priority: 2,
        labels: ['Feature', 'platform', 'api'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Team is required')
    })

    it('should require priority', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        labels: ['Feature', 'platform', 'api'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Priority is required'))).toBe(true)
    })

    it('should validate priority range', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        priority: 5,
        labels: ['Feature', 'platform', 'api'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('1-4'))).toBe(true)
    })

    it('should require minimum 3 labels', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Minimum 3 labels'))).toBe(true)
    })

    it('should require work type label', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        priority: 2,
        labels: ['platform', 'api', 'database'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Work Type'))).toBe(true)
    })

    it('should require business unit label', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'api', 'database'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Business Unit'))).toBe(true)
    })

    it('should require domain or infrastructure label', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'parallel_safe'],
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Domain or Infrastructure'))).toBe(true)
    })

    it('should accept infrastructure label instead of domain', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'mcp'],
      })

      expect(result.labelAnalysis.hasInfrastructure).toBe(true)
      expect(result.errors.filter((e) => e.includes('Domain or Infrastructure'))).toHaveLength(0)
    })

    it('should warn on unknown labels', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'api', 'custom-label'],
      })

      expect(result.warnings.some((w) => w.includes('Unknown labels'))).toBe(true)
    })

    it('should warn on missing description sections', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'api'],
        description: 'Just a simple description',
      })

      expect(result.warnings.some((w) => w.includes('## Context'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('## Summary'))).toBe(true)
    })

    it('should suggest delegation label', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'api'],
      })

      expect(result.suggestions.some((s) => s.includes('delegation'))).toBe(true)
    })

    it('should track label analysis', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'api', 'delegate:cursor', 'parallel_safe'],
      })

      expect(result.labelAnalysis.hasWorkType).toBe(true)
      expect(result.labelAnalysis.hasBusinessUnit).toBe(true)
      expect(result.labelAnalysis.hasDomain).toBe(true)
      expect(result.labelAnalysis.hasDelegation).toBe(true)
      expect(result.labelAnalysis.hasParallel).toBe(true)
    })
  })

  describe('getLabelsForCategory', () => {
    it('should return labels for work type', () => {
      const labels = getLabelsForCategory('workType')

      expect(labels).toContain('Feature')
      expect(labels).toContain('Bug')
    })

    it('should return labels for domain', () => {
      const labels = getLabelsForCategory('domain')

      expect(labels).toContain('database')
      expect(labels).toContain('api')
    })
  })

  describe('getAllLabels', () => {
    it('should return all labels as flat array', () => {
      const labels = getAllLabels()

      expect(labels).toContain('Feature')
      expect(labels).toContain('platform')
      expect(labels).toContain('database')
      expect(labels).toContain('mcp')
    })
  })

  describe('isValidLabel', () => {
    it('should return true for valid labels', () => {
      expect(isValidLabel('Feature')).toBe(true)
      expect(isValidLabel('platform')).toBe(true)
      expect(isValidLabel('database')).toBe(true)
    })

    it('should return false for invalid labels', () => {
      expect(isValidLabel('invalid-label')).toBe(false)
      expect(isValidLabel('random')).toBe(false)
    })
  })

  describe('getLabelCategory', () => {
    it('should return correct category', () => {
      expect(getLabelCategory('Feature')).toBe('workType')
      expect(getLabelCategory('platform')).toBe('businessUnit')
      expect(getLabelCategory('database')).toBe('domain')
      expect(getLabelCategory('mcp')).toBe('infrastructure')
    })

    it('should return null for unknown labels', () => {
      expect(getLabelCategory('unknown')).toBeNull()
    })
  })

  describe('suggestLabels', () => {
    it('should suggest Bug for bug-related descriptions', () => {
      const labels = suggestLabels('Fix the broken login page')

      expect(labels).toContain('Bug')
    })

    it('should suggest Feature by default', () => {
      const labels = suggestLabels('Add a new dashboard')

      expect(labels).toContain('Feature')
    })

    it('should suggest Improvement for refactoring', () => {
      const labels = suggestLabels('Improve the performance of the API')

      expect(labels).toContain('Improvement')
    })

    it('should suggest spike for research tasks', () => {
      const labels = suggestLabels('Research the best auth solution')

      expect(labels).toContain('spike')
    })

    it('should suggest publisher for blog content', () => {
      const labels = suggestLabels('Create a new blog article')

      expect(labels).toContain('publisher')
    })

    it('should suggest platform for dashboard features', () => {
      const labels = suggestLabels('Add analytics to the dashboard')

      expect(labels).toContain('platform')
    })

    it('should suggest database domain for schema tasks', () => {
      const labels = suggestLabels('Add new migration for users table')

      expect(labels).toContain('database')
    })

    it('should suggest api domain for endpoint tasks', () => {
      const labels = suggestLabels('Create new API endpoint for users')

      expect(labels).toContain('api')
    })

    it('should suggest auth domain for login tasks', () => {
      const labels = suggestLabels('Fix login permission issue')

      expect(labels).toContain('auth')
    })

    it('should suggest ai domain for AI tasks', () => {
      const labels = suggestLabels('Integrate Claude for chat')

      expect(labels).toContain('ai')
    })
  })

  describe('formatValidationResult', () => {
    it('should format valid result', () => {
      const result = validateIssueParams({
        title: 'Add user dashboard feature',
        team: 'Engineering',
        priority: 2,
        labels: ['Feature', 'platform', 'database'],
      })

      const formatted = formatValidationResult(result)

      expect(formatted).toContain('Valid')
      expect(formatted).toContain('Label Coverage')
    })

    it('should format invalid result with errors', () => {
      const result = validateIssueParams({
        title: '',
        labels: [],
      })

      const formatted = formatValidationResult(result)

      expect(formatted).toContain('Invalid')
      expect(formatted).toContain('Errors')
    })

    it('should include warnings section', () => {
      const result = validateIssueParams({
        title: 'Fix bug',
        team: 'Eng',
        priority: 2,
        labels: ['Bug', 'platform', 'api'],
      })

      const formatted = formatValidationResult(result)

      expect(formatted).toContain('Warnings')
    })
  })
})
