/**
 * MCP Tool Validation Middleware
 *
 * Intercepts tool calls BEFORE execution to validate parameters.
 * This is the key to "real-time enforcement" - catch errors before they happen.
 *
 * Architecture:
 * 1. Tool call comes in
 * 2. Middleware validates based on tool type
 * 3. If invalid: Return structured error with suggestions (no API call made)
 * 4. If valid: Proceed to execute
 *
 * Benefits:
 * - Prevention instead of detection
 * - Agent receives guidance to self-correct
 * - No wasted API calls
 * - Consistent enforcement across all interfaces
 */

// Type definitions for validation
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  expected?: string | string[];
  received?: unknown;
}

export interface ToolValidationResult {
  proceed: boolean;
  validation?: ValidationResult;
  blockReason?: string;
}

// ============================================================================
// Label Taxonomy (Single Source of Truth for MCP Server)
// ============================================================================

const LABEL_TAXONOMY = {
  workType: ['Feature', 'Bug', 'Improvement', 'spike', 'epic', 'refactor', 'tech-debt', 'documentation'],
  businessUnit: ['publisher', 'platform', 'agency', 'store'],
  domain: ['database', 'api', 'auth', 'security', 'performance', 'testing', 'qa', 'analytics', 'ai'],
  infrastructure: ['shared-infra', 'mcp', 'pipeline', 'vercel', 'cloudflare', 'deploy', 'n8n'],
  delegation: ['delegate:cursor', 'delegate:claude-code', 'delegate:gpt', 'delegate:blocked'],
  parallel: ['parallel_safe', 'serial_required'],
} as const;

// ============================================================================
// Linear Tool Validators
// ============================================================================

/**
 * Validate linear_create_issue parameters
 */
function validateLinearCreateIssue(params: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required: title
  if (!params.title || typeof params.title !== 'string' || (params.title as string).trim().length === 0) {
    errors.push({
      code: 'MISSING_TITLE',
      message: 'Title is required',
      field: 'title',
      expected: 'non-empty string',
      received: params.title,
    });
  } else if ((params.title as string).length < 10) {
    warnings.push('Title seems too short - should be descriptive');
  }

  // Required: team
  if (!params.team || typeof params.team !== 'string') {
    errors.push({
      code: 'MISSING_TEAM',
      message: 'Team is required',
      field: 'team',
      expected: 'Engineering (or team name/ID)',
      received: params.team,
    });
  }

  // Required: priority
  if (params.priority === undefined || params.priority === null) {
    errors.push({
      code: 'MISSING_PRIORITY',
      message: 'Priority is required (1=Urgent, 2=High, 3=Medium, 4=Low)',
      field: 'priority',
      expected: ['1', '2', '3', '4'],
      received: params.priority,
    });
  } else if (typeof params.priority === 'number' && (params.priority < 1 || params.priority > 4)) {
    errors.push({
      code: 'INVALID_PRIORITY',
      message: 'Priority must be 1-4',
      field: 'priority',
      expected: ['1', '2', '3', '4'],
      received: params.priority,
    });
  }

  // Required: labels (minimum 3)
  const labels = Array.isArray(params.labels) ? params.labels : [];
  
  if (labels.length < 3) {
    errors.push({
      code: 'INSUFFICIENT_LABELS',
      message: `Minimum 3 labels required (got ${labels.length}). Need: Work Type + Business Unit + (Domain OR Infrastructure)`,
      field: 'labels',
      expected: ['Feature/Bug/Improvement', 'publisher/platform/agency/store', 'database/api/auth/...'],
      received: labels,
    });
  } else {
    // Check for required label categories
    const hasWorkType = labels.some((l: string) => LABEL_TAXONOMY.workType.includes(l as typeof LABEL_TAXONOMY.workType[number]));
    const hasBusinessUnit = labels.some((l: string) => LABEL_TAXONOMY.businessUnit.includes(l as typeof LABEL_TAXONOMY.businessUnit[number]));
    const hasDomain = labels.some((l: string) => LABEL_TAXONOMY.domain.includes(l as typeof LABEL_TAXONOMY.domain[number]));
    const hasInfrastructure = labels.some((l: string) => LABEL_TAXONOMY.infrastructure.includes(l as typeof LABEL_TAXONOMY.infrastructure[number]));

    if (!hasWorkType) {
      errors.push({
        code: 'MISSING_WORK_TYPE_LABEL',
        message: 'Missing Work Type label',
        field: 'labels',
        expected: LABEL_TAXONOMY.workType as unknown as string[],
        received: labels,
      });
    }

    if (!hasBusinessUnit) {
      errors.push({
        code: 'MISSING_BUSINESS_UNIT_LABEL',
        message: 'Missing Business Unit label',
        field: 'labels',
        expected: LABEL_TAXONOMY.businessUnit as unknown as string[],
        received: labels,
      });
    }

    if (!hasDomain && !hasInfrastructure) {
      errors.push({
        code: 'MISSING_DOMAIN_OR_INFRA_LABEL',
        message: 'Missing Domain or Infrastructure label',
        field: 'labels',
        expected: [...LABEL_TAXONOMY.domain, ...LABEL_TAXONOMY.infrastructure],
        received: labels,
      });
    }

    // Check for delegation (suggestion, not error)
    const hasDelegation = labels.some((l: string) => LABEL_TAXONOMY.delegation.includes(l as typeof LABEL_TAXONOMY.delegation[number]));
    if (!hasDelegation) {
      suggestions.push('Consider adding a delegation label: delegate:cursor, delegate:claude-code');
    }
  }

  // Check description structure
  const description = params.description as string | undefined;
  if (description) {
    if (!description.includes('## Context')) {
      warnings.push('Description should include ## Context section');
    }
    if (!description.includes('## Summary')) {
      warnings.push('Description should include ## Summary section');
    }
    if (!description.includes('## Scope')) {
      warnings.push('Description should include ## Scope section');
    }
    if (!description.includes('## Acceptance Criteria')) {
      warnings.push('Description should include ## Acceptance Criteria section');
    }
  } else {
    warnings.push('Description is empty - should include structured sections');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Validate linear_update_issue parameters
 */
function validateLinearUpdateIssue(params: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required: issue ID
  if (!params.id && !params.issueId && !params.identifier) {
    errors.push({
      code: 'MISSING_ISSUE_ID',
      message: 'Issue ID is required',
      field: 'id',
      expected: 'string (issue ID or identifier like ENG-123)',
    });
  }

  // If adding labels, validate them
  const labels = Array.isArray(params.labels) ? params.labels : [];
  if (labels.length > 0) {
    // Validate that labels are known
    const allKnownLabels: Set<string> = new Set([
      ...LABEL_TAXONOMY.workType,
      ...LABEL_TAXONOMY.businessUnit,
      ...LABEL_TAXONOMY.domain,
      ...LABEL_TAXONOMY.infrastructure,
      ...LABEL_TAXONOMY.delegation,
      ...LABEL_TAXONOMY.parallel,
    ]);

    const unknownLabels = labels.filter((l: string) => !allKnownLabels.has(l));
    if (unknownLabels.length > 0) {
      warnings.push(`Unknown labels: ${unknownLabels.join(', ')}. These may be valid but are not in the taxonomy.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Supabase Tool Validators
// ============================================================================

/**
 * Validate supabase_query parameters
 * Prevents injection and enforces read-only
 */
function validateSupabaseQuery(params: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const query = params.query as string | undefined;

  if (!query || typeof query !== 'string') {
    errors.push({
      code: 'MISSING_QUERY',
      message: 'SQL query is required',
      field: 'query',
      expected: 'SELECT statement',
    });
    return { valid: false, errors, warnings, suggestions };
  }

  // Normalize query for checking
  const normalizedQuery = query.trim().toUpperCase();

  // Must be SELECT only
  if (!normalizedQuery.startsWith('SELECT')) {
    errors.push({
      code: 'NOT_SELECT_QUERY',
      message: 'Only SELECT queries are allowed (read-only)',
      field: 'query',
      expected: 'SELECT ...',
      received: query.substring(0, 50),
    });
  }

  // Block dangerous keywords
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'CREATE'];
  for (const keyword of dangerousKeywords) {
    if (normalizedQuery.includes(keyword)) {
      errors.push({
        code: 'DANGEROUS_KEYWORD',
        message: `Query contains dangerous keyword: ${keyword}`,
        field: 'query',
      });
    }
  }

  // Warn about SELECT *
  if (normalizedQuery.includes('SELECT *')) {
    warnings.push('SELECT * is inefficient - consider selecting specific columns');
  }

  // Warn about missing LIMIT
  if (!normalizedQuery.includes('LIMIT')) {
    warnings.push('Query has no LIMIT - consider adding LIMIT for performance');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Main Validation Middleware
// ============================================================================

/**
 * Validate tool parameters before execution
 *
 * @param tool - Tool name (e.g., 'linear_create_issue')
 * @param params - Tool parameters
 * @returns Validation result with proceed flag
 */
export function validateToolCall(
  tool: string,
  params: Record<string, unknown>
): ToolValidationResult {
  // Linear tool validation
  if (tool === 'linear_create_issue') {
    const validation = validateLinearCreateIssue(params);
    if (!validation.valid) {
      return {
        proceed: false,
        validation,
        blockReason: formatValidationErrors(validation),
      };
    }
    return { proceed: true, validation };
  }

  if (tool === 'linear_update_issue') {
    const validation = validateLinearUpdateIssue(params);
    if (!validation.valid) {
      return {
        proceed: false,
        validation,
        blockReason: formatValidationErrors(validation),
      };
    }
    return { proceed: true, validation };
  }

  // Supabase query validation
  if (tool === 'supabase_query') {
    const validation = validateSupabaseQuery(params);
    if (!validation.valid) {
      return {
        proceed: false,
        validation,
        blockReason: formatValidationErrors(validation),
      };
    }
    return { proceed: true, validation };
  }

  // No validation defined - proceed
  return { proceed: true };
}

/**
 * Format validation errors for display
 */
function formatValidationErrors(validation: ValidationResult): string {
  const lines: string[] = ['⛔ VALIDATION FAILED - Tool call blocked', ''];

  if (validation.errors.length > 0) {
    lines.push('## Errors (must fix)');
    for (const error of validation.errors) {
      lines.push(`- **${error.code}**: ${error.message}`);
      if (error.field) {
        lines.push(`  Field: \`${error.field}\``);
      }
      if (error.expected) {
        const expected = Array.isArray(error.expected)
          ? error.expected.join(', ')
          : error.expected;
        lines.push(`  Expected: ${expected}`);
      }
      if (error.received !== undefined) {
        lines.push(`  Received: ${JSON.stringify(error.received)}`);
      }
    }
    lines.push('');
  }

  if (validation.warnings.length > 0) {
    lines.push('## Warnings');
    for (const warning of validation.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
    lines.push('');
  }

  if (validation.suggestions.length > 0) {
    lines.push('## Suggestions');
    for (const suggestion of validation.suggestions) {
      lines.push(`- 💡 ${suggestion}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create a structured error response for blocked tool calls
 */
export function createBlockedResponse(tool: string, result: ToolValidationResult): {
  error: string;
  code: string;
  validation: ValidationResult | undefined;
  tool: string;
} {
  return {
    error: result.blockReason || 'Validation failed',
    code: 'VALIDATION_ERROR',
    validation: result.validation,
    tool,
  };
}

