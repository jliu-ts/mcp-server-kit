/**
 * Linear Helpers
 *
 * Utility functions for common Linear operations.
 * Part of the 100% Zero Hallucination Architecture.
 *
 * Key Functions:
 * - checkForDuplicates: Prevents duplicate ticket creation
 * - createIssueValidated: Full validation + dedup + create
 * - createIssueFromTemplate: Generate description from structured data
 *
 * Token Economics: ~300 tokens for full validated create vs ~15,000 tokens manual
 */

import type { Result } from '../types.js';
import { fail, ok } from '../types.js';
import type { LinearClient } from './client.js';
import {
  generateBugTemplate,
  generateFeatureTemplate,
  generateInfraTemplate,
  generateSpikeTemplate,
  type BugTemplateData,
  type InfraTemplateData,
  type SpikeTemplateData,
  type TemplateData,
} from './templates.js';
import {
  suggestLabels,
  validateIssueParams,
  type IssueParams,
  type ValidationResult,
} from './validation.js';

// ============================================================================
// Types
// ============================================================================

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  candidates: Array<{
    identifier: string;
    title: string;
    similarity: number;
    url?: string;
  }>;
}

export interface ValidatedIssueParams extends IssueParams {
  /** Skip duplicate check (use with caution) */
  skipDupCheck?: boolean;
  /** Force creation even with validation warnings */
  forceCreate?: boolean;
}

export interface CreateFromTemplateParams {
  type: 'feature' | 'bug' | 'infra' | 'spike';
  title: string;
  team: string;
  priority: number;
  labels: string[];
  templateData:
    | TemplateData
    | BugTemplateData
    | InfraTemplateData
    | SpikeTemplateData;
  parentId?: string;
  skipDupCheck?: boolean;
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Check for potential duplicate issues before creating
 *
 * @example
 * const result = await checkForDuplicates(client, 'Add user dashboard');
 * if (result.data.hasDuplicates) {
 *   console.log('Potential duplicates:', result.data.candidates);
 * }
 */
export async function checkForDuplicates(
  client: LinearClient,
  title: string,
  options: { threshold?: number; limit?: number } = {}
): Promise<Result<DuplicateCheckResult>> {
  const threshold = options.threshold ?? 0.5;
  const limit = options.limit ?? 10;

  // Extract meaningful keywords from title (skip common words)
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'need',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'add',
    'create',
    'update',
    'fix',
    'implement',
    'build',
  ]);

  const keywords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 5);

  if (keywords.length === 0) {
    // No meaningful keywords, skip search
    return ok({ hasDuplicates: false, candidates: [] });
  }

  const searchQuery = keywords.join(' ');
  const result = await client.searchIssues({ query: searchQuery, limit });

  if (!result.success) {
    return result as Result<DuplicateCheckResult>;
  }

  // Calculate similarity and filter
  const candidates = result.data.issues
    .map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      similarity: calculateSimilarity(
        title.toLowerCase(),
        issue.title.toLowerCase()
      ),
      url: issue.url,
    }))
    .filter((c) => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return ok({
    hasDuplicates: candidates.length > 0,
    candidates,
  });
}

/**
 * Calculate string similarity using Jaccard index with bigrams
 */
function calculateSimilarity(a: string, b: string): number {
  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    const words = str.split(/\s+/).filter((w) => w.length > 0);

    // Word bigrams
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]} ${words[i + 1]}`);
    }

    // Also add individual words for better matching
    for (const word of words) {
      bigrams.add(word);
    }

    return bigrams;
  };

  const setA = getBigrams(a);
  const setB = getBigrams(b);

  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

// ============================================================================
// Validated Issue Creation
// ============================================================================

/**
 * Create an issue with full validation and duplicate checking
 *
 * This is the recommended way to create issues programmatically.
 * It enforces all Linear standards from LINEAR-STANDARDS.md.
 *
 * @example
 * const result = await createIssueValidated(client, {
 *   title: 'Add user dashboard',
 *   team: 'Engineering',
 *   priority: 2,
 *   labels: ['Feature', 'platform', 'database'],
 *   description: generateFeatureTemplate({ ... }),
 * });
 */
export async function createIssueValidated(
  client: LinearClient,
  params: ValidatedIssueParams
): Promise<
  Result<{
    issue: { id: string; identifier: string; title: string; url: string };
  }>
> {
  // Step 1: Validate parameters
  const validation = validateIssueParams(params);

  if (!validation.valid) {
    return fail(
      'VALIDATION_ERROR',
      `Ticket validation failed:\n${validation.errors.join('\n')}`,
      400
    );
  }

  // Log warnings even if proceeding
  if (validation.warnings.length > 0 && !params.forceCreate) {
    console.warn(
      '[Linear] Validation warnings:',
      validation.warnings.join('; ')
    );
  }

  // Step 2: Check for duplicates (unless skipped)
  if (!params.skipDupCheck) {
    const dupCheck = await checkForDuplicates(client, params.title);

    if (dupCheck.success && dupCheck.data.hasDuplicates) {
      const candidates = dupCheck.data.candidates
        .slice(0, 3)
        .map(
          (c) =>
            `  - ${c.identifier}: "${c.title}" (${Math.round(
              c.similarity * 100
            )}% similar)`
        )
        .join('\n');

      return fail(
        'DUPLICATE_DETECTED',
        `Potential duplicate issues found:\n${candidates}\n\nUse skipDupCheck: true to override, or update existing issue instead.`,
        409
      );
    }
  }

  // Step 3: Create issue (validation already confirmed required fields exist)
  return client.createIssue({
    title: params.title,
    team: params.team!, // Validated as required
    description: params.description,
    priority: params.priority,
    labels: params.labels,
  });
}

/**
 * Create an issue from a template with full validation
 *
 * Automatically generates the description from structured data.
 *
 * @example
 * const result = await createIssueFromTemplate(client, {
 *   type: 'feature',
 *   title: 'Add user dashboard',
 *   team: 'Engineering',
 *   priority: 2,
 *   labels: ['Feature', 'platform', 'database'],
 *   templateData: {
 *     summary: 'Create a user dashboard for viewing stats',
 *     input: 'User ID',
 *     output: 'Dashboard page with stats',
 *     database: 'users, user_stats',
 *   },
 * });
 */
export async function createIssueFromTemplate(
  client: LinearClient,
  params: CreateFromTemplateParams
): Promise<
  Result<{
    issue: { id: string; identifier: string; title: string; url: string };
  }>
> {
  // Generate description based on type
  let description: string;

  switch (params.type) {
    case 'feature':
      description = generateFeatureTemplate(
        params.templateData as TemplateData
      );
      break;
    case 'bug':
      description = generateBugTemplate(params.templateData as BugTemplateData);
      break;
    case 'infra':
      description = generateInfraTemplate(
        params.templateData as InfraTemplateData
      );
      break;
    case 'spike':
      description = generateSpikeTemplate(
        params.templateData as SpikeTemplateData
      );
      break;
    default:
      description = generateFeatureTemplate(
        params.templateData as TemplateData
      );
  }

  return createIssueValidated(client, {
    title: params.title,
    team: params.team,
    priority: params.priority,
    labels: params.labels,
    description,
    parentId: params.parentId,
    skipDupCheck: params.skipDupCheck,
  });
}

// ============================================================================
// Quick Actions
// ============================================================================

/**
 * Search for related issues before creating
 * Returns issues that might be related or worth linking
 */
export async function findRelatedIssues(
  client: LinearClient,
  title: string,
  options: { limit?: number } = {}
): Promise<
  Result<
    Array<{ identifier: string; title: string; state: string; url?: string }>
  >
> {
  const limit = options.limit ?? 5;

  // Extract keywords
  const keywords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(' ');

  if (!keywords) {
    return ok([]);
  }

  const result = await client.searchIssues({ query: keywords, limit });

  if (!result.success) {
    return result as Result<
      Array<{ identifier: string; title: string; state: string; url?: string }>
    >;
  }

  return ok(
    result.data.issues.map((issue) => ({
      identifier: issue.identifier,
      title: issue.title,
      state: issue.state?.name ?? 'Unknown',
      url: issue.url,
    }))
  );
}

/**
 * Auto-suggest labels for a task
 * Useful for quick issue creation
 */
export function autoSuggestLabels(taskDescription: string): {
  suggested: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const suggested = suggestLabels(taskDescription);

  // Confidence based on how many labels we could determine
  let confidence: 'high' | 'medium' | 'low';
  if (suggested.length >= 3) {
    confidence = 'high';
  } else if (suggested.length >= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { suggested, confidence };
}

/**
 * Validate and provide feedback before creating
 * Good for interactive/chat-based creation
 */
export function preflightCheck(params: IssueParams): {
  ready: boolean;
  validation: ValidationResult;
  suggestions: {
    labels?: string[];
    priority?: number;
  };
} {
  const validation = validateIssueParams(params);

  const suggestions: { labels?: string[]; priority?: number } = {};

  // Suggest labels if missing
  if (
    !validation.labelAnalysis.hasWorkType ||
    !validation.labelAnalysis.hasBusinessUnit ||
    (!validation.labelAnalysis.hasDomain &&
      !validation.labelAnalysis.hasInfrastructure)
  ) {
    suggestions.labels = suggestLabels(params.title);
  }

  // Suggest priority if missing
  if (params.priority === undefined) {
    // Default to Normal (3) unless urgent keywords detected
    const urgentKeywords = ['urgent', 'asap', 'critical', 'blocking', 'hotfix'];
    const hasUrgent = urgentKeywords.some(
      (k) =>
        params.title.toLowerCase().includes(k) ||
        params.description?.toLowerCase().includes(k)
    );
    suggestions.priority = hasUrgent ? 1 : 3;
  }

  return {
    ready: validation.valid,
    validation,
    suggestions,
  };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format duplicate check result for display
 */
export function formatDuplicateCheckResult(
  result: DuplicateCheckResult
): string {
  if (!result.hasDuplicates) {
    return '✅ No duplicates found';
  }

  const lines = ['⚠️ Potential duplicates found:', ''];

  for (const candidate of result.candidates) {
    lines.push(`- **${candidate.identifier}**: "${candidate.title}"`);
    lines.push(`  Similarity: ${Math.round(candidate.similarity * 100)}%`);
    if (candidate.url) {
      lines.push(`  Link: ${candidate.url}`);
    }
    lines.push('');
  }

  lines.push(
    'Consider updating an existing issue instead of creating a new one.'
  );

  return lines.join('\n');
}

/**
 * Format preflight check for display
 */
export function formatPreflightCheck(
  result: ReturnType<typeof preflightCheck>
): string {
  const lines: string[] = [];

  lines.push(
    result.ready ? '✅ Ready to create' : '❌ Not ready - fix errors first'
  );
  lines.push('');

  if (result.validation.errors.length > 0) {
    lines.push('### Errors');
    for (const error of result.validation.errors) {
      lines.push(`- ❌ ${error}`);
    }
    lines.push('');
  }

  if (result.validation.warnings.length > 0) {
    lines.push('### Warnings');
    for (const warning of result.validation.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
    lines.push('');
  }

  if (Object.keys(result.suggestions).length > 0) {
    lines.push('### Suggestions');
    if (result.suggestions.labels) {
      lines.push(`- Labels: ${result.suggestions.labels.join(', ')}`);
    }
    if (result.suggestions.priority) {
      const priorityMap = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low' };
      lines.push(
        `- Priority: ${result.suggestions.priority} (${
          priorityMap[result.suggestions.priority as keyof typeof priorityMap]
        })`
      );
    }
  }

  return lines.join('\n');
}
