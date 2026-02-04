/**
 * Linear Description Templates
 *
 * Generates properly structured ticket descriptions.
 * Replaces loading 7KB of docs with 2KB of code.
 * Part of the 100% Zero Hallucination Architecture.
 *
 * Token Economics: ~100 tokens to generate vs ~5,000 tokens to construct manually
 */

// ============================================================================
// Types
// ============================================================================

export interface TemplateData {
  /** Parent issue reference */
  parent?: { id: string; title?: string };
  /** Schema reference (table name) */
  schema?: string;
  /** One-sentence summary */
  summary: string;
  /** Input requirements */
  input: string;
  /** Expected output */
  output: string;
  /** Database tables affected (or 'None') */
  database?: string;
  /** File paths affected */
  files?: string[];
  /** Acceptance criteria */
  criteria?: Array<{ criterion: string; verification: string }>;
  /** Additional context rows */
  additionalContext?: Array<{ relation: string; type: string; link: string }>;
}

export interface BugTemplateData {
  /** Bug summary */
  summary: string;
  /** Severity level */
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  /** Environment where bug occurs */
  environment: 'Production' | 'Staging' | 'Local' | 'All';
  /** Steps to reproduce */
  steps: string[];
  /** Expected behavior */
  expected: string;
  /** Actual behavior */
  actual: string;
  /** Error message or stack trace */
  error?: string;
  /** Screenshots or additional context */
  screenshots?: string[];
}

export interface InfraTemplateData extends TemplateData {
  /** Services affected */
  services?: string[];
  /** Environment variables needed */
  envVars?: Array<{ name: string; purpose: string }>;
  /** Deployment steps */
  deploymentSteps?: string[];
}

export interface EpicTemplateData {
  /** Epic summary */
  summary: string;
  /** Business objective */
  objective: string;
  /** Success metrics */
  metrics: Array<{ metric: string; target: string }>;
  /** Child issues (if known) */
  children?: Array<{ title: string; scope: string }>;
  /** Timeline */
  timeline?: {
    start: string;
    end: string;
    milestones?: Array<{ date: string; milestone: string }>;
  };
}

export interface SpikeTemplateData {
  /** Research question */
  question: string;
  /** Context and background */
  background: string;
  /** What we need to learn */
  learnings: string[];
  /** Time box (hours) */
  timeBox: number;
  /** Expected deliverable */
  deliverable: string;
}

// ============================================================================
// Template Functions
// ============================================================================

/**
 * Generate a Feature ticket description
 */
export function generateFeatureTemplate(data: TemplateData): string {
  const contextRows = buildContextRows(data);
  const criteriaRows = buildCriteriaRows(
    data.criteria ?? [
      { criterion: 'TypeScript builds', verification: '`pnpm build` passes' },
      { criterion: 'Works in browser', verification: 'Manual test' },
    ]
  );

  return `## Context

| Relation | Type | Link |
| -------- | ---- | ---- |
${contextRows}

## Summary

${data.summary}

## Scope

| Boundary | Value |
| -------- | ----- |
| Input | ${data.input} |
| Output | ${data.output} |
| Database | ${data.database ?? 'None'} |
| Files | ${data.files?.join(', ') ?? 'TBD'} |

## Acceptance Criteria

| Criterion | Verification |
| --------- | ------------ |
${criteriaRows}

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] \`pnpm build\` passes
- [ ] Tested locally
- [ ] PR created with issue link
`;
}

/**
 * Generate a Bug ticket description
 */
export function generateBugTemplate(data: BugTemplateData): string {
  const stepsFormatted = data.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const errorSection = data.error
    ? `\n## Error Details\n\n\`\`\`\n${data.error}\n\`\`\`\n`
    : '';

  const screenshotsSection = data.screenshots?.length
    ? `\n## Screenshots\n\n${data.screenshots
        .map((s) => `- ${s}`)
        .join('\n')}\n`
    : '';

  return `## Summary

${data.summary}

## Bug Details

| Property | Value |
| -------- | ----- |
| Severity | ${data.severity} |
| Environment | ${data.environment} |

## Steps to Reproduce

${stepsFormatted}

## Expected Behavior

${data.expected}

## Actual Behavior

${data.actual}
${errorSection}${screenshotsSection}
## Acceptance Criteria

| Criterion | Verification |
| --------- | ------------ |
| Bug not reproducible | Follow steps above |
| No regression | Related features work |
| Tests pass | \`pnpm test\` passes |

## Definition of Done

- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Regression test added
- [ ] \`pnpm build\` passes
`;
}

/**
 * Generate an Infrastructure ticket description
 */
export function generateInfraTemplate(data: InfraTemplateData): string {
  const base = generateFeatureTemplate(data);

  const envVarSection = data.envVars?.length
    ? `\n## Environment Variables\n\n| Variable | Purpose |\n| -------- | ------- |\n${data.envVars
        .map((v) => `| \`${v.name}\` | ${v.purpose} |`)
        .join('\n')}\n`
    : '';

  const servicesSection = data.services?.length
    ? `\n## Services Affected\n\n${data.services
        .map((s) => `- ${s}`)
        .join('\n')}\n`
    : '';

  const deploymentSection = data.deploymentSteps?.length
    ? `\n## Deployment Steps\n\n${data.deploymentSteps
        .map((s, i) => `${i + 1}. ${s}`)
        .join('\n')}\n`
    : '';

  return base + servicesSection + envVarSection + deploymentSection;
}

/**
 * Generate an Epic ticket description
 */
export function generateEpicTemplate(data: EpicTemplateData): string {
  const metricsRows = data.metrics
    .map((m) => `| ${m.metric} | ${m.target} |`)
    .join('\n');

  const childrenSection = data.children?.length
    ? `\n## Planned Issues\n\n${data.children
        .map((c) => `- [ ] **${c.title}**: ${c.scope}`)
        .join('\n')}\n`
    : '';

  const timelineSection = data.timeline
    ? `\n## Timeline\n\n| Date | Milestone |\n| ---- | --------- |\n| ${
        data.timeline.start
      } | Start |\n${
        data.timeline.milestones
          ?.map((m) => `| ${m.date} | ${m.milestone} |`)
          .join('\n') ?? ''
      }| ${data.timeline.end} | End |\n`
    : '';

  return `## Summary

${data.summary}

## Business Objective

${data.objective}

## Success Metrics

| Metric | Target |
| ------ | ------ |
${metricsRows}
${childrenSection}${timelineSection}
## Definition of Done

- [ ] All child issues complete
- [ ] Success metrics validated
- [ ] Stakeholder sign-off
`;
}

/**
 * Generate a Spike/Research ticket description
 */
export function generateSpikeTemplate(data: SpikeTemplateData): string {
  const learningsFormatted = data.learnings.map((l) => `- ${l}`).join('\n');

  return `## Research Question

${data.question}

## Background

${data.background}

## What We Need to Learn

${learningsFormatted}

## Constraints

| Constraint | Value |
| ---------- | ----- |
| Time Box | ${data.timeBox} hours |
| Deliverable | ${data.deliverable} |

## Expected Output

- [ ] Document findings in \`docs/research/\` or ADR
- [ ] Recommendation with pros/cons
- [ ] Follow-up tickets if implementation needed

## Definition of Done

- [ ] Question answered
- [ ] Findings documented
- [ ] Follow-up work identified
`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildContextRows(data: TemplateData): string {
  const rows: string[] = [];

  if (data.parent) {
    const link = `https://linear.app/trending-society/issue/${data.parent.id}`;
    rows.push(`| Parent | Epic | [${data.parent.id}](${link}) |`);
  }

  if (data.schema) {
    rows.push(
      `| Schema | Reference | [SCHEMA.md#${data.schema}](../agents/schema/SCHEMA.md#${data.schema}) |`
    );
  }

  if (data.additionalContext) {
    for (const ctx of data.additionalContext) {
      rows.push(`| ${ctx.relation} | ${ctx.type} | ${ctx.link} |`);
    }
  }

  if (rows.length === 0) {
    rows.push('| N/A | N/A | N/A |');
  }

  return rows.join('\n');
}

function buildCriteriaRows(
  criteria: Array<{ criterion: string; verification: string }>
): string {
  return criteria
    .map((c) => `| ${c.criterion} | ${c.verification} |`)
    .join('\n');
}

// ============================================================================
// Quick Templates (Common Patterns)
// ============================================================================

/**
 * Quick template for database migration
 */
export function generateMigrationTemplate(params: {
  tableName: string;
  action: 'create' | 'alter' | 'drop';
  description: string;
  columns?: Array<{ name: string; type: string; nullable: boolean }>;
}): string {
  const columnsSection = params.columns?.length
    ? `\n## Columns\n\n| Column | Type | Nullable |\n| ------ | ---- | -------- |\n${params.columns
        .map(
          (c) => `| \`${c.name}\` | ${c.type} | ${c.nullable ? 'Yes' : 'No'} |`
        )
        .join('\n')}\n`
    : '';

  return (
    generateFeatureTemplate({
      summary: params.description,
      input: `${params.action.toUpperCase()} TABLE ${params.tableName}`,
      output: 'Applied migration + updated types',
      database: params.tableName,
      schema: params.tableName,
      files: [
        `supabase/migrations/YYYYMMDD_${params.action}_${params.tableName}.sql`,
        'packages/db/src/database.types.ts',
        'agents/schema/SCHEMA.md',
      ],
      criteria: [
        {
          criterion: 'Migration applies',
          verification: '`supabase db push` succeeds',
        },
        {
          criterion: 'Types regenerated',
          verification: '`pnpm db:generate-types` succeeds',
        },
        { criterion: 'SCHEMA.md updated', verification: 'Manual review' },
        {
          criterion: 'RLS policy added',
          verification: 'If tenant-scoped table',
        },
      ],
    }) + columnsSection
  );
}

/**
 * Quick template for API endpoint
 */
export function generateApiTemplate(params: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}): string {
  return generateFeatureTemplate({
    summary: params.description,
    input:
      `${params.method} ${params.path}` +
      (params.requestBody ? ` (${params.requestBody})` : ''),
    output: params.responseBody ?? 'JSON response',
    database: 'TBD',
    files: [`apps/*/src/app/api${params.path}/route.ts`],
    criteria: [
      { criterion: 'Endpoint responds', verification: 'HTTP status 200/201' },
      { criterion: 'Auth required', verification: 'Returns 401 without token' },
      {
        criterion: 'Validation works',
        verification: 'Returns 400 on bad input',
      },
      { criterion: 'Types correct', verification: 'Response matches schema' },
    ],
  });
}

/**
 * Quick template for UI component
 */
export function generateComponentTemplate(params: {
  name: string;
  description: string;
  location: 'dashboard' | 'web' | 'shared';
  hasState: boolean;
}): string {
  const basePath =
    params.location === 'shared'
      ? 'packages/ui/src/components'
      : `apps/${params.location}/src/components`;

  return generateFeatureTemplate({
    summary: params.description,
    input: 'Design/specs',
    output: `${params.name} component`,
    database: 'None',
    files: [
      `${basePath}/${params.name.toLowerCase()}.tsx`,
      params.hasState
        ? `${basePath}/${params.name.toLowerCase()}.hooks.ts`
        : undefined,
    ].filter(Boolean) as string[],
    criteria: [
      { criterion: 'Renders correctly', verification: 'Visual inspection' },
      { criterion: 'Responsive', verification: 'Works on mobile' },
      { criterion: 'Accessible', verification: 'ARIA labels present' },
      { criterion: 'Themed correctly', verification: 'Uses CSS variables' },
    ],
  });
}
