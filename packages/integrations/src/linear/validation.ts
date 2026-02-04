/**
 * Linear Parameter Validation
 *
 * Validates issue parameters before API calls.
 * Prevents incomplete tickets from being created.
 * Part of the 100% Zero Hallucination Architecture.
 *
 * Token Economics: ~50 tokens to call vs ~3,000 tokens to load docs
 */

// ============================================================================
// Label Taxonomy (Single Source of Truth)
// ============================================================================

// Default delegation labels - customize for your project
const DELEGATION_LABELS = [
  "delegate:cursor",
  "delegate:claude-code",
  "delegate:human",
] as const;

export const LABEL_TAXONOMY = {
  /** Work type labels - exactly 1 required */
  workType: [
    "Feature",
    "Bug",
    "Improvement",
    "spike",
    "epic",
    "refactor",
    "tech-debt",
    "documentation",
  ],

  /** Business unit labels - exactly 1 required */
  businessUnit: ["publisher", "platform", "agency", "store"],

  /** Domain labels - at least 1 required (if no infrastructure) */
  domain: [
    "database",
    "api",
    "auth",
    "security",
    "performance",
    "testing",
    "qa",
    "analytics",
    "ai",
  ],

  /** Infrastructure labels - can substitute for domain */
  infrastructure: [
    "shared-infra",
    "mcp",
    "pipeline",
    "vercel",
    "cloudflare",
    "deploy",
    "n8n",
  ],

  /** Delegation labels - derived from orchestration package */
  delegation: DELEGATION_LABELS,

  /** Parallel execution labels - optional but recommended */
  parallel: ["parallel_safe", "serial_required"],

  /** Status labels - managed by workflow */
  status: ["needs-review", "blocked", "duplicate"],

  /** Architecture labels */
  architecture: ["skill", "adr"],
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  labelAnalysis: {
    hasWorkType: boolean;
    hasBusinessUnit: boolean;
    hasDomain: boolean;
    hasInfrastructure: boolean;
    hasDelegation: boolean;
    hasParallel: boolean;
  };
}

export interface IssueParams {
  title: string;
  team?: string;
  priority?: number;
  labels?: string[];
  description?: string;
  parentId?: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate issue parameters against Linear standards
 *
 * @example
 * const result = validateIssueParams({
 *   title: 'Add user dashboard',
 *   team: 'Engineering',
 *   priority: 2,
 *   labels: ['Feature', 'platform', 'database'],
 * });
 *
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateIssueParams(params: IssueParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // --------------------------------------------------------------------------
  // Required: title
  // --------------------------------------------------------------------------
  if (!params.title?.trim()) {
    errors.push("Title is required");
  } else if (params.title.length < 10) {
    warnings.push("Title seems too short - should be descriptive");
  } else if (params.title.length > 200) {
    warnings.push("Title is very long - consider summarizing");
  }

  // --------------------------------------------------------------------------
  // Required: team
  // --------------------------------------------------------------------------
  if (!params.team) {
    errors.push("Team is required");
  }

  // --------------------------------------------------------------------------
  // Required: priority
  // --------------------------------------------------------------------------
  if (params.priority === undefined) {
    errors.push("Priority is required (1=Urgent, 2=High, 3=Medium, 4=Low)");
  } else if (params.priority < 1 || params.priority > 4) {
    errors.push("Priority must be 1-4 (1=Urgent, 2=High, 3=Medium, 4=Low)");
  }

  // --------------------------------------------------------------------------
  // Required: minimum 3 labels
  // --------------------------------------------------------------------------
  const labels = params.labels ?? [];

  // Check label categories
  const hasWorkType = labels.some((l) =>
    LABEL_TAXONOMY.workType.includes(
      l as (typeof LABEL_TAXONOMY.workType)[number],
    ),
  );
  const hasBusinessUnit = labels.some((l) =>
    LABEL_TAXONOMY.businessUnit.includes(
      l as (typeof LABEL_TAXONOMY.businessUnit)[number],
    ),
  );
  const hasDomain = labels.some((l) =>
    LABEL_TAXONOMY.domain.includes(l as (typeof LABEL_TAXONOMY.domain)[number]),
  );
  const hasInfrastructure = labels.some((l) =>
    LABEL_TAXONOMY.infrastructure.includes(
      l as (typeof LABEL_TAXONOMY.infrastructure)[number],
    ),
  );
  const hasDelegation = labels.some((l) =>
    LABEL_TAXONOMY.delegation.includes(
      l as (typeof LABEL_TAXONOMY.delegation)[number],
    ),
  );
  const hasParallel = labels.some((l) =>
    LABEL_TAXONOMY.parallel.includes(
      l as (typeof LABEL_TAXONOMY.parallel)[number],
    ),
  );

  const labelAnalysis = {
    hasWorkType,
    hasBusinessUnit,
    hasDomain,
    hasInfrastructure,
    hasDelegation,
    hasParallel,
  };

  if (labels.length < 3) {
    errors.push(
      `Minimum 3 labels required (got ${labels.length}). ` +
        `Need: Work Type + Business Unit + (Domain OR Infrastructure)`,
    );
  }

  if (!hasWorkType) {
    errors.push(
      `Missing Work Type label. Choose one: ${LABEL_TAXONOMY.workType.join(
        ", ",
      )}`,
    );
  }

  if (!hasBusinessUnit) {
    errors.push(
      `Missing Business Unit label. Choose one: ${LABEL_TAXONOMY.businessUnit.join(
        ", ",
      )}`,
    );
  }

  if (!hasDomain && !hasInfrastructure) {
    errors.push(
      `Missing Domain or Infrastructure label. ` +
        `Domain: ${LABEL_TAXONOMY.domain.join(", ")}. ` +
        `Infrastructure: ${LABEL_TAXONOMY.infrastructure.join(", ")}`,
    );
  }

  // Validate unknown labels
  const allKnownLabels: Set<string> = new Set([
    ...LABEL_TAXONOMY.workType,
    ...LABEL_TAXONOMY.businessUnit,
    ...LABEL_TAXONOMY.domain,
    ...LABEL_TAXONOMY.infrastructure,
    ...LABEL_TAXONOMY.delegation,
    ...LABEL_TAXONOMY.parallel,
    ...LABEL_TAXONOMY.status,
    ...LABEL_TAXONOMY.architecture,
  ]);

  const unknownLabels = labels.filter((l) => !allKnownLabels.has(l));
  if (unknownLabels.length > 0) {
    warnings.push(
      `Unknown labels: ${unknownLabels.join(
        ", ",
      )}. These may be valid but are not in the taxonomy.`,
    );
  }

  // --------------------------------------------------------------------------
  // Check description structure
  // --------------------------------------------------------------------------
  const desc = params.description ?? "";

  if (!desc) {
    warnings.push("Description is empty - should include structured sections");
  } else {
    if (!desc.includes("## Context")) {
      warnings.push("Description should include ## Context table");
    }
    if (!desc.includes("## Summary")) {
      warnings.push("Description should include ## Summary section");
    }
    if (!desc.includes("## Scope")) {
      warnings.push("Description should include ## Scope table");
    }
    if (!desc.includes("## Acceptance Criteria")) {
      warnings.push("Description should include ## Acceptance Criteria table");
    }
  }

  // --------------------------------------------------------------------------
  // Suggestions
  // --------------------------------------------------------------------------
  if (!hasDelegation) {
    suggestions.push(
      "Consider adding a delegation label: delegate:cursor (auto) or delegate:claude-code (complex)",
    );
  }
  if (!hasParallel) {
    suggestions.push(
      "Consider adding parallel_safe or serial_required label for multi-agent coordination",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    labelAnalysis,
  };
}

/**
 * Get valid labels for a specific category
 */
export function getLabelsForCategory(
  category: keyof typeof LABEL_TAXONOMY,
): readonly string[] {
  return LABEL_TAXONOMY[category];
}

/**
 * Get all labels as a flat array
 */
export function getAllLabels(): string[] {
  return Object.values(LABEL_TAXONOMY).flat() as string[];
}

/**
 * Check if a label is valid (exists in any category)
 */
export function isValidLabel(label: string): boolean {
  const allLabels = new Set(getAllLabels());
  return allLabels.has(label);
}

/**
 * Get the category of a label
 */
export function getLabelCategory(
  label: string,
): keyof typeof LABEL_TAXONOMY | null {
  for (const [category, labels] of Object.entries(LABEL_TAXONOMY)) {
    if ((labels as readonly string[]).includes(label)) {
      return category as keyof typeof LABEL_TAXONOMY;
    }
  }
  return null;
}

/**
 * Suggest labels based on task description
 */
export function suggestLabels(taskDescription: string): string[] {
  const suggestions: string[] = [];
  const desc = taskDescription.toLowerCase();

  // Work type detection
  if (desc.includes("bug") || desc.includes("fix") || desc.includes("broken")) {
    suggestions.push("Bug");
  } else if (
    desc.includes("improve") ||
    desc.includes("refactor") ||
    desc.includes("optimize")
  ) {
    suggestions.push("Improvement");
  } else if (
    desc.includes("research") ||
    desc.includes("investigate") ||
    desc.includes("spike")
  ) {
    suggestions.push("spike");
  } else if (desc.includes("epic") || desc.includes("initiative")) {
    suggestions.push("epic");
  } else {
    suggestions.push("Feature");
  }

  // Business unit detection
  if (
    desc.includes("blog") ||
    desc.includes("content") ||
    desc.includes("article") ||
    desc.includes("seo")
  ) {
    suggestions.push("publisher");
  } else if (
    desc.includes("dashboard") ||
    desc.includes("saas") ||
    desc.includes("uci")
  ) {
    suggestions.push("platform");
  } else if (desc.includes("client") || desc.includes("agency")) {
    suggestions.push("agency");
  } else if (
    desc.includes("shop") ||
    desc.includes("ecommerce") ||
    desc.includes("product")
  ) {
    suggestions.push("store");
  } else {
    suggestions.push("platform"); // Default
  }

  // Domain/Infrastructure detection
  if (
    desc.includes("database") ||
    desc.includes("migration") ||
    desc.includes("schema") ||
    desc.includes("table")
  ) {
    suggestions.push("database");
  } else if (
    desc.includes("api") ||
    desc.includes("endpoint") ||
    desc.includes("route")
  ) {
    suggestions.push("api");
  } else if (
    desc.includes("auth") ||
    desc.includes("login") ||
    desc.includes("permission")
  ) {
    suggestions.push("auth");
  } else if (
    desc.includes("ai") ||
    desc.includes("llm") ||
    desc.includes("openai") ||
    desc.includes("claude")
  ) {
    suggestions.push("ai");
  } else if (
    desc.includes("worker") ||
    desc.includes("edge") ||
    desc.includes("cloudflare")
  ) {
    suggestions.push("cloudflare");
  } else if (
    desc.includes("deploy") ||
    desc.includes("ci") ||
    desc.includes("pipeline")
  ) {
    suggestions.push("deploy");
  } else if (
    desc.includes("shared") ||
    desc.includes("package") ||
    desc.includes("lib")
  ) {
    suggestions.push("shared-infra");
  }

  return suggestions;
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push("## Issue Validation Results\n");
  lines.push(`**Status:** ${result.valid ? "✅ Valid" : "❌ Invalid"}\n`);

  if (result.errors.length > 0) {
    lines.push("### ❌ Errors (must fix)\n");
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("### ⚠️ Warnings\n");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  if (result.suggestions.length > 0) {
    lines.push("### 💡 Suggestions\n");
    for (const suggestion of result.suggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push("");
  }

  lines.push("### Label Coverage\n");
  lines.push(`| Category | Status |`);
  lines.push(`| -------- | ------ |`);
  lines.push(
    `| Work Type | ${result.labelAnalysis.hasWorkType ? "✅" : "❌"} |`,
  );
  lines.push(
    `| Business Unit | ${result.labelAnalysis.hasBusinessUnit ? "✅" : "❌"} |`,
  );
  lines.push(`| Domain | ${result.labelAnalysis.hasDomain ? "✅" : "—"} |`);
  lines.push(
    `| Infrastructure | ${
      result.labelAnalysis.hasInfrastructure ? "✅" : "—"
    } |`,
  );
  lines.push(
    `| Delegation | ${result.labelAnalysis.hasDelegation ? "✅" : "—"} |`,
  );
  lines.push(`| Parallel | ${result.labelAnalysis.hasParallel ? "✅" : "—"} |`);

  return lines.join("\n");
}
