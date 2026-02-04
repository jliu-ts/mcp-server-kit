/**
 * Automation Jobs Runner
 *
 * Handles scheduled (cron) jobs for multi-tenant automations.
 * Each automation type has its own handler that loops through
 * all tenants who have that automation enabled.
 */

import { Env } from '../index';

interface TenantAutomation {
  id: string;
  tenant_id: string;
  automation_key: string;
  config: Record<string, unknown>;
  credentials_ref: string | null;
  timezone: string;
  enabled: boolean;
  run_count: number;
  error_count: number;
}

interface AutomationRun {
  tenant_automation_id: string;
  tenant_id: string;
  automation_key: string;
  status: 'running' | 'success' | 'failure' | 'skipped';
  trigger_type: 'cron' | 'manual' | 'webhook';
  items_processed?: number;
  items_succeeded?: number;
  items_failed?: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
}

/**
 * Helper to make Supabase REST API calls
 */
async function supabaseQuery(
  env: Env,
  table: string,
  options: {
    method?: string;
    schema?: string;
    select?: string;
    filters?: Record<string, string>;
    body?: unknown;
    upsert?: boolean;
    single?: boolean;
  } = {}
): Promise<{ data: unknown; error: unknown }> {
  const { method = 'GET', schema = 'system', select, filters, body, upsert, single } = options;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { data: null, error: 'Supabase credentials not configured' };
  }

  let url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  if (select) params.set('select', select);
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const headers: Record<string, string> = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': schema,
    'Content-Profile': schema,
  };

  if (upsert) headers['Prefer'] = 'resolution=merge-duplicates';
  if (single) headers['Accept'] = 'application/vnd.pgrst.object+json';

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      return { data: null, error: text };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

/**
 * Main scheduled handler - routes to appropriate automation
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log(`[CRON] Triggered: ${event.cron} at ${new Date().toISOString()}`);

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('[CRON] Missing Supabase credentials');
    return;
  }

  // Map cron expressions to automation keys
  const cronToAutomation: Record<string, string> = {
    '0 9 * * *': 'social_post',      // Daily at 9am UTC
    '0 6 * * *': 'order_sync',       // Daily at 6am UTC
    '0 8 * * 1': 'weekly_report',    // Monday at 8am UTC
    '0 10 * * *': 'content_repurpose', // Daily at 10am UTC
    '0 */4 * * *': 'inventory_alert', // Every 4 hours
    '0 0 * * *': 'competitor_monitor', // Daily at midnight
  };

  const automationKey = cronToAutomation[event.cron];

  if (!automationKey) {
    console.log(`[CRON] No automation mapped to cron: ${event.cron}`);
    return;
  }

  // Get all tenants with this automation enabled
  const { data: tenants, error } = await supabaseQuery(env, 'tenant_automations', {
    select: '*',
    filters: {
      'automation_key': `eq.${automationKey}`,
      'enabled': 'eq.true',
    },
  });

  if (error) {
    console.error(`[CRON] Failed to fetch tenants:`, error);
    return;
  }

  const tenantList = tenants as TenantAutomation[] | null;
  if (!tenantList || tenantList.length === 0) {
    console.log(`[CRON] No tenants subscribed to: ${automationKey}`);
    return;
  }

  console.log(`[CRON] Running ${automationKey} for ${tenantList.length} tenants`);

  // Run automation for each tenant
  for (const tenant of tenantList) {
    ctx.waitUntil(runAutomationForTenant(env, tenant, automationKey));
  }
}

/**
 * Run a specific automation for a tenant
 */
async function runAutomationForTenant(
  env: Env,
  tenant: TenantAutomation,
  automationKey: string
): Promise<void> {
  const startTime = Date.now();
  let runId: string | null = null;

  // Log run start
  const run: AutomationRun = {
    tenant_automation_id: tenant.id,
    tenant_id: tenant.tenant_id,
    automation_key: automationKey,
    status: 'running',
    trigger_type: 'cron',
    started_at: new Date().toISOString(),
  };

  const { data: runRecord } = await supabaseQuery(env, 'automation_runs', {
    method: 'POST',
    body: run,
    single: true,
  });

  if (runRecord && typeof runRecord === 'object' && 'id' in runRecord) {
    runId = (runRecord as { id: string }).id;
  }

  try {
    // Route to specific automation handler
    let result: { processed: number; succeeded: number; failed: number };

    switch (automationKey) {
      case 'social_post':
        result = await runSocialPostAutomation(env, tenant);
        break;
      case 'order_sync':
        result = await runOrderSyncAutomation(env, tenant);
        break;
      case 'weekly_report':
        result = await runWeeklyReportAutomation(env, tenant);
        break;
      case 'inventory_alert':
        result = await runInventoryAlertAutomation(env, tenant);
        break;
      default:
        console.log(`[CRON] No handler for automation: ${automationKey}`);
        result = { processed: 0, succeeded: 0, failed: 0 };
    }

    // Update run record with success
    const duration = Date.now() - startTime;
    if (runId) {
      await supabaseQuery(env, 'automation_runs', {
        method: 'PATCH',
        filters: { 'id': `eq.${runId}` },
        body: {
          status: 'success',
          finished_at: new Date().toISOString(),
          duration_ms: duration,
          items_processed: result.processed,
          items_succeeded: result.succeeded,
          items_failed: result.failed,
        },
      });
    }

    // Update tenant automation stats
    await supabaseQuery(env, 'tenant_automations', {
      method: 'PATCH',
      filters: { 'id': `eq.${tenant.id}` },
      body: {
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_duration_ms: duration,
        run_count: tenant.run_count + 1,
      },
    });

    console.log(`[CRON] ${automationKey} completed for ${tenant.tenant_id} in ${duration}ms`);

  } catch (err) {
    const error = err as Error;
    const duration = Date.now() - startTime;

    // Update run record with failure
    if (runId) {
      await supabaseQuery(env, 'automation_runs', {
        method: 'PATCH',
        filters: { 'id': `eq.${runId}` },
        body: {
          status: 'failure',
          finished_at: new Date().toISOString(),
          duration_ms: duration,
          error_message: error.message,
          error_stack: error.stack,
        },
      });
    }

    // Update tenant automation stats
    await supabaseQuery(env, 'tenant_automations', {
      method: 'PATCH',
      filters: { 'id': `eq.${tenant.id}` },
      body: {
        last_run_at: new Date().toISOString(),
        last_run_status: 'failure',
        last_error: error.message,
        error_count: tenant.error_count + 1,
      },
    });

    console.error(`[CRON] ${automationKey} failed for ${tenant.tenant_id}:`, error);
  }
}

// ============================================================================
// Automation Handlers
// ============================================================================

/**
 * Social Post Automation
 * Publishes scheduled content to connected social platforms
 *
 * STATUS: Not yet implemented - will skip gracefully
 */
async function runSocialPostAutomation(
  _env: Env,
  tenant: TenantAutomation
): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`[social_post] SKIPPED - not yet implemented for tenant: ${tenant.tenant_id}`);
  // Future: Fetch scheduled posts, post to platforms, update status
  return { processed: 0, succeeded: 0, failed: 0 };
}

/**
 * Order Sync Automation
 * Syncs Shopify orders to Google Sheets or other destinations
 *
 * STATUS: Not yet implemented - will skip gracefully
 */
async function runOrderSyncAutomation(
  _env: Env,
  tenant: TenantAutomation
): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`[order_sync] SKIPPED - not yet implemented for tenant: ${tenant.tenant_id}`);
  // Future: Fetch orders from Shopify, transform, append to destination
  return { processed: 0, succeeded: 0, failed: 0 };
}

/**
 * Weekly Report Automation
 * Emails performance summary to tenant
 *
 * STATUS: Not yet implemented - will skip gracefully
 */
async function runWeeklyReportAutomation(
  _env: Env,
  tenant: TenantAutomation
): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`[weekly_report] SKIPPED - not yet implemented for tenant: ${tenant.tenant_id}`);
  // Future: Query analytics, generate report, send via email
  return { processed: 0, succeeded: 0, failed: 0 };
}

/**
 * Inventory Alert Automation
 * Notifies when inventory drops below threshold
 *
 * STATUS: Not yet implemented - will skip gracefully
 */
async function runInventoryAlertAutomation(
  _env: Env,
  tenant: TenantAutomation
): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`[inventory_alert] SKIPPED - not yet implemented for tenant: ${tenant.tenant_id}`);
  // Future: Fetch inventory from Shopify, check threshold, send notification
  return { processed: 0, succeeded: 0, failed: 0 };
}
