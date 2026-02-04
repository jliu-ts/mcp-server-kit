import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface TenantClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class TenantClient {
  private supabase: SupabaseClient;

  constructor(config: TenantClientConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  async listTenants() {
    const { data, error } = await this.supabase
      .from("tenants")
      .select("id, name, slug, domain, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getTenantConfig(id: string) {
    // Determine if input is UUID or Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );
    const column = isUuid ? "id" : "slug";

    const { data: tenant, error: tenantError } = await this.supabase
      .from("tenants")
      .select("*")
      .eq(column, id)
      .single();

    if (tenantError) throw tenantError;

    const { data: branding, error: brandingError } = await this.supabase
      .from("tenant_themes")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    // It's okay if branding doesn't exist yet
    if (brandingError && brandingError.code !== "PGRST116") throw brandingError;

    return {
      tenant,
      branding: branding || null,
    };
  }
}
