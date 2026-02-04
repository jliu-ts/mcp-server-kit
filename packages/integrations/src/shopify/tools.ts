/**
 * Shopify AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Shopify operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createShopifyTools } from '@trendingsociety/integrations/shopify'
 * import { ShopifyClient } from '@trendingsociety/integrations/shopify'
 *
 * const client = new ShopifyClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
 * })
 * const tools = createShopifyTools(client)
 *
 * // Use with AI SDK agent
 * const agent = new ToolLoopAgent({ tools: { ...tools } })
 */

import { tool } from "ai";
import { z } from "zod";
import type { ShopifyClient } from "./client.js";

// ============================================================================
// Input Schemas (Zod)
// ============================================================================

export const GetProductsInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Max products to return (max 50)"),
  query: z.string().optional().describe("Search query to filter products"),
});

export const GetProductInputSchema = z.object({
  id: z.string().describe("Product ID (numeric or gid://shopify/Product/...)"),
});

export const GetOrdersInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Max orders to return (max 50)"),
  status: z
    .string()
    .optional()
    .describe("Filter by financial status (paid, pending, refunded)"),
});

export const GetOrderInputSchema = z.object({
  id: z.string().describe("Order ID (numeric or gid://shopify/Order/...)"),
});

export const GetCustomersInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Max customers to return (max 50)"),
  query: z.string().optional().describe("Search query to filter customers"),
});

export const GetDashboardKPIsInputSchema = z.object({
  period: z
    .enum(["today", "7d", "30d", "90d"])
    .optional()
    .default("7d")
    .describe("Time period for KPIs"),
});

export const GetRevenueTrendInputSchema = z.object({
  days: z
    .number()
    .optional()
    .default(30)
    .describe("Number of days to include in trend"),
});

export const GetLowStockAlertsInputSchema = z.object({
  threshold: z
    .number()
    .optional()
    .default(10)
    .describe("Stock level threshold for alerts"),
  limit: z.number().optional().default(20).describe("Max alerts to return"),
});

export const GetActionQueueInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(20)
    .describe("Max action items to return"),
});

export const GetTopProductsInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Number of top products to return"),
  period: z
    .enum(["7d", "30d", "90d"])
    .optional()
    .default("30d")
    .describe("Time period for sales data"),
});

export const GetCollectionsInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(20)
    .describe("Max collections to return"),
  query: z.string().optional().describe("Search query to filter collections"),
});

export const GetInventoryLevelsInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(50)
    .describe("Max inventory items to return"),
  productId: z.string().optional().describe("Filter by product ID"),
});

export const GetDiscountCodesInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(20)
    .describe("Max discount codes to return"),
  query: z.string().optional().describe("Search query to filter discounts"),
});

export const FulfillOrderInputSchema = z.object({
  orderId: z.string().describe("Order ID to fulfill"),
  trackingNumber: z.string().optional().describe("Shipment tracking number"),
  trackingUrl: z.string().optional().describe("Tracking URL"),
  trackingCompany: z.string().optional().describe("Shipping carrier name"),
  notifyCustomer: z
    .boolean()
    .optional()
    .default(true)
    .describe("Send fulfillment notification to customer"),
});

export const UpdateProductInputSchema = z.object({
  id: z.string().describe("Product ID to update"),
  title: z.string().optional().describe("New product title"),
  descriptionHtml: z
    .string()
    .optional()
    .describe("New product description (HTML)"),
  status: z
    .enum(["ACTIVE", "ARCHIVED", "DRAFT"])
    .optional()
    .describe("Product status"),
  vendor: z.string().optional().describe("Product vendor"),
  productType: z.string().optional().describe("Product type"),
  tags: z.array(z.string()).optional().describe("Product tags"),
});

export const CreateProductInputSchema = z.object({
  title: z.string().describe("Product title (required)"),
  descriptionHtml: z.string().optional().describe("Product description (HTML)"),
  status: z
    .enum(["ACTIVE", "ARCHIVED", "DRAFT"])
    .optional()
    .default("DRAFT")
    .describe("Initial product status"),
  vendor: z.string().optional().describe("Product vendor"),
  productType: z.string().optional().describe("Product type"),
  tags: z.array(z.string()).optional().describe("Product tags"),
});

export const AdjustInventoryInputSchema = z.object({
  inventoryItemId: z.string().describe("Inventory item ID"),
  locationId: z.string().describe("Location ID"),
  delta: z.number().describe("Quantity change (+/- integer)"),
});

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create AI SDK tools for Shopify operations
 *
 * @param client - Initialized ShopifyClient instance
 * @returns Object containing all Shopify tools
 */
export function createShopifyTools(client: ShopifyClient) {
  return {
    // -------------------------------------------------------------------------
    // Products
    // -------------------------------------------------------------------------

    shopify_get_products: tool({
      description: "List Shopify products with optional search query",
      inputSchema: GetProductsInputSchema,
      execute: async (params) => {
        const result = await client.getProducts(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_product: tool({
      description: "Get a single Shopify product by ID with full details",
      inputSchema: GetProductInputSchema,
      execute: async (params) => {
        const result = await client.getProduct(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_create_product: tool({
      description: "Create a new product in Shopify",
      inputSchema: CreateProductInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createProduct(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_update_product: tool({
      description: "Update an existing Shopify product",
      inputSchema: UpdateProductInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateProduct(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_delete_product: tool({
      description:
        "Permanently delete a Shopify product. This action cannot be undone.",
      inputSchema: z.object({
        id: z
          .string()
          .describe("Product ID to delete (numeric or gid://shopify/Product/...)"),
      }),
      needsApproval: true,
      execute: async (params) => {
        const result = await client.deleteProduct(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Orders
    // -------------------------------------------------------------------------

    shopify_get_orders: tool({
      description: "List Shopify orders with optional status filter",
      inputSchema: GetOrdersInputSchema,
      execute: async (params) => {
        const result = await client.getOrders(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_order: tool({
      description: "Get a single Shopify order by ID with full details",
      inputSchema: GetOrderInputSchema,
      execute: async (params) => {
        const result = await client.getOrder(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_fulfill_order: tool({
      description:
        "Mark a Shopify order as fulfilled with optional tracking info",
      inputSchema: FulfillOrderInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.fulfillOrder(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Customers
    // -------------------------------------------------------------------------

    shopify_get_customers: tool({
      description: "List Shopify customers with optional search query",
      inputSchema: GetCustomersInputSchema,
      execute: async (params) => {
        const result = await client.getCustomers(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Shop Info
    // -------------------------------------------------------------------------

    shopify_get_shop: tool({
      description: "Get Shopify store information (name, domain, plan, etc.)",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getShop();
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Analytics & Dashboard
    // -------------------------------------------------------------------------

    shopify_get_dashboard_kpis: tool({
      description:
        "Get dashboard KPIs (revenue, orders, AOV) with period comparison",
      inputSchema: GetDashboardKPIsInputSchema,
      execute: async (params) => {
        const result = await client.getDashboardKPIs(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_revenue_trend: tool({
      description: "Get daily revenue trend data for charting",
      inputSchema: GetRevenueTrendInputSchema,
      execute: async (params) => {
        const result = await client.getRevenueTrend(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_top_products: tool({
      description: "Get top-selling products by revenue for a period",
      inputSchema: GetTopProductsInputSchema,
      execute: async (params) => {
        const result = await client.getTopProducts(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Inventory & Alerts
    // -------------------------------------------------------------------------

    shopify_get_low_stock_alerts: tool({
      description: "Get products with inventory below threshold",
      inputSchema: GetLowStockAlertsInputSchema,
      execute: async (params) => {
        const result = await client.getLowStockAlerts(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_action_queue: tool({
      description:
        "Get pending actions (unfulfilled orders, payment pending, low stock)",
      inputSchema: GetActionQueueInputSchema,
      execute: async (params) => {
        const result = await client.getActionQueue(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_inventory_levels: tool({
      description: "Get inventory levels across locations",
      inputSchema: GetInventoryLevelsInputSchema,
      execute: async (params) => {
        const result = await client.getInventoryLevels(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_adjust_inventory: tool({
      description: "Adjust inventory quantity at a location",
      inputSchema: AdjustInventoryInputSchema,
      needsApproval: true,
      execute: async (params) => {
        const result = await client.adjustInventory(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Collections & Locations
    // -------------------------------------------------------------------------

    shopify_get_collections: tool({
      description: "List product collections",
      inputSchema: GetCollectionsInputSchema,
      execute: async (params) => {
        const result = await client.getCollections(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_get_locations: tool({
      description: "List all store locations",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getLocations();
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_create_collection: tool({
      description:
        "Create a new collection in Shopify. Can be manual or smart (rule-based).",
      inputSchema: z.object({
        title: z.string().describe("Collection title (required)"),
        descriptionHtml: z
          .string()
          .optional()
          .describe("Collection description (HTML)"),
        sortOrder: z
          .string()
          .optional()
          .describe(
            "Sort order (ALPHA_ASC, ALPHA_DESC, BEST_SELLING, CREATED, CREATED_DESC, MANUAL, PRICE_ASC, PRICE_DESC)"
          ),
      }),
      needsApproval: true,
      execute: async (params) => {
        const result = await client.createCollection(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_update_collection: tool({
      description: "Update an existing collection in Shopify",
      inputSchema: z.object({
        id: z
          .string()
          .describe("Collection ID (numeric or gid://shopify/Collection/...)"),
        title: z.string().optional().describe("New collection title"),
        descriptionHtml: z
          .string()
          .optional()
          .describe("New collection description (HTML)"),
        sortOrder: z
          .string()
          .optional()
          .describe(
            "Sort order (ALPHA_ASC, ALPHA_DESC, BEST_SELLING, CREATED, CREATED_DESC, MANUAL, PRICE_ASC, PRICE_DESC)"
          ),
      }),
      needsApproval: true,
      execute: async (params) => {
        const result = await client.updateCollection(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_add_products_to_collection: tool({
      description: "Add products to an existing collection",
      inputSchema: z.object({
        collectionId: z.string().describe("Collection ID to add products to"),
        productIds: z.array(z.string()).describe("Array of product IDs to add"),
      }),
      needsApproval: true,
      execute: async (params) => {
        const result = await client.addProductsToCollection(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    shopify_remove_products_from_collection: tool({
      description: "Remove products from a collection",
      inputSchema: z.object({
        collectionId: z
          .string()
          .describe("Collection ID to remove products from"),
        productIds: z
          .array(z.string())
          .describe("Array of product IDs to remove"),
      }),
      needsApproval: true,
      execute: async (params) => {
        const result = await client.removeProductsFromCollection(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),

    // -------------------------------------------------------------------------
    // Discounts
    // -------------------------------------------------------------------------

    shopify_get_discount_codes: tool({
      description: "List discount codes with optional search",
      inputSchema: GetDiscountCodesInputSchema,
      execute: async (params) => {
        const result = await client.getDiscountCodes(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      },
    }),
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type ShopifyTools = ReturnType<typeof createShopifyTools>;
export type ShopifyToolName = keyof ShopifyTools;
