import { tool } from "ai";
import { z } from "zod";
import type { TenantClient } from "./client";

export const createTenantTools = (client: TenantClient) => {
  return {
    list_tenants: tool({
      description:
        "List all registered tenants on the platform. Returns basic info like name, slug, and domain.",
      inputSchema: z.object({}),
      execute: async () => {
        return await client.listTenants();
      },
    }),
    get_tenant_config: tool({
      description:
        "Get full configuration and branding for a specific tenant. Accepts either Tenant ID (UUID) or Slug.",
      inputSchema: z.object({
        id: z
          .string()
          .describe('The Tenant ID (UUID) or Slug (e.g. "acme-corp")'),
      }),
      execute: async ({ id }) => {
        return await client.getTenantConfig(id);
      },
    }),
  };
};
