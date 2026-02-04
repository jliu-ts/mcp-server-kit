/**
 * Shopify Admin API Client
 *
 * Runtime-agnostic client for Shopify's GraphQL Admin API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { ShopifyClient } from '@trendingsociety/integrations/shopify'
 *
 * const shopify = new ShopifyClient({
 *   storeDomain: 'mystore.myshopify.com',
 *   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
 * })
 *
 * const products = await shopify.getProducts({ limit: 10 })
 * const orders = await shopify.getOrders({ status: 'paid' })
 */

import { API } from "../config/constants";
import {
  graphqlRequest,
  ok,
  type ClientConfig,
  type Result,
} from "../types.js";
import type {
  ActionQueueItem,
  AdjustInventoryParams,
  AdjustInventoryResponse,
  CreateProductParams,
  CreateProductResponse,
  FulfillOrderParams,
  FulfillOrderResponse,
  GetActionQueueParams,
  GetActionQueueResponse,
  GetCollectionsParams,
  GetCollectionsResponse,
  GetCustomersParams,
  GetCustomersResponse,
  GetDashboardKPIsParams,
  GetDashboardKPIsResponse,
  GetDiscountCodesParams,
  GetDiscountCodesResponse,
  GetInventoryLevelsParams,
  GetInventoryLevelsResponse,
  GetLocationsResponse,
  GetLowStockAlertsParams,
  GetLowStockAlertsResponse,
  GetOrderParams,
  GetOrderResponse,
  GetOrdersParams,
  GetOrdersResponse,
  GetProductParams,
  GetProductResponse,
  GetProductsParams,
  GetProductsResponse,
  GetRevenueTrendParams,
  GetRevenueTrendResponse,
  GetShopResponse,
  GetTopProductsParams,
  GetTopProductsResponse,
  LowStockProduct,
  ProductInventory,
  RevenueTrendDataPoint,
  ShopifyCollection,
  ShopifyCustomer,
  ShopifyDiscountCode,
  ShopifyLocation,
  ShopifyOrder,
  ShopifyProduct,
  ShopifyShop,
  UpdateProductParams,
  UpdateProductResponse,
} from "./types.js";

// ============================================================================
// Configuration
// ============================================================================

const API_VERSION = "2024-01";

export interface ShopifyClientConfig extends ClientConfig {
  /** Store domain (e.g., mystore.myshopify.com) */
  storeDomain: string;
  /** Admin API access token */
  accessToken: string;
  /** API version (default: 2024-01) */
  apiVersion?: string;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class ShopifyClient {
  private storeDomain: string;
  private accessToken: string;
  private apiVersion: string;
  private timeout: number;
  private fetchFn: typeof fetch;
  private debug: boolean;

  constructor(config: ShopifyClientConfig) {
    if (!config.storeDomain) {
      throw new Error("ShopifyClient requires storeDomain");
    }
    if (!config.accessToken) {
      throw new Error("ShopifyClient requires accessToken");
    }

    this.storeDomain = config.storeDomain.replace(/^https?:\/\//, "");
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? API_VERSION;
    this.timeout = config.timeout ?? API.defaultTimeout;
    this.fetchFn = config.fetch ?? fetch;
    this.debug = config.debug ?? false;
  }

  private get apiUrl(): string {
    return `https://${this.storeDomain}/admin/api/${this.apiVersion}/graphql.json`;
  }

  // --------------------------------------------------------------------------
  // Get Products
  // --------------------------------------------------------------------------

  async getProducts(
    params: GetProductsParams = {}
  ): Promise<Result<GetProductsResponse>> {
    const limit = Math.min(params.limit ?? 10, 50);
    const queryFilter = params.query ? `, query: "${params.query}"` : "";

    const query = `
      query GetProducts($first: Int!) {
        products(first: $first${queryFilter}) {
          edges {
            node {
              id
              title
              handle
              status
              vendor
              productType
              createdAt
              updatedAt
              totalInventory
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              featuredImage {
                url
                altText
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const result = await this.query<{
      products: {
        edges: Array<{
          node: ShopifyProduct & {
            variants: { edges: Array<{ node: unknown }> };
          };
        }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: limit });

    if (!result.success) {
      return result;
    }

    const products = result.data.products.edges.map((edge) => ({
      ...edge.node,
      variants: edge.node.variants?.edges?.map((v) => v.node) ?? [],
    }));

    return ok({
      count: products.length,
      products: products as ShopifyProduct[],
      hasMore: result.data.products.pageInfo.hasNextPage,
    });
  }

  // --------------------------------------------------------------------------
  // Get Orders
  // --------------------------------------------------------------------------

  async getOrders(
    params: GetOrdersParams = {}
  ): Promise<Result<GetOrdersResponse>> {
    const limit = Math.min(params.limit ?? 10, 50);
    const statusFilter = params.status
      ? `, query: "financial_status:${params.status}"`
      : "";

    const query = `
      query GetOrders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true${statusFilter}) {
          edges {
            node {
              id
              name
              email
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalShippingPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalTaxSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              shippingAddress {
                city
                province
                country
              }
              customer {
                id
                email
                firstName
                lastName
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const result = await this.query<{
      orders: {
        edges: Array<{
          node: ShopifyOrder & {
            lineItems: { edges: Array<{ node: unknown }> };
          };
        }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: limit });

    if (!result.success) {
      return result;
    }

    const orders = result.data.orders.edges.map((edge) => ({
      ...edge.node,
      lineItems: edge.node.lineItems?.edges?.map((li) => li.node) ?? [],
    }));

    return ok({
      count: orders.length,
      orders: orders as ShopifyOrder[],
      hasMore: result.data.orders.pageInfo.hasNextPage,
    });
  }

  // --------------------------------------------------------------------------
  // Get Customers
  // --------------------------------------------------------------------------

  async getCustomers(
    params: GetCustomersParams = {}
  ): Promise<Result<GetCustomersResponse>> {
    const limit = Math.min(params.limit ?? 10, 50);
    const queryFilter = params.query ? `, query: "${params.query}"` : "";

    const query = `
      query GetCustomers($first: Int!) {
        customers(first: $first, sortKey: CREATED_AT, reverse: true${queryFilter}) {
          edges {
            node {
              id
              email
              firstName
              lastName
              phone
              createdAt
              updatedAt
              numberOfOrders
              amountSpent {
                amount
                currencyCode
              }
              defaultAddress {
                city
                province
                country
              }
              tags
              state
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const result = await this.query<{
      customers: {
        edges: Array<{ node: ShopifyCustomer }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: limit });

    if (!result.success) {
      return result;
    }

    const customers = result.data.customers.edges.map((edge) => edge.node);

    return ok({
      count: customers.length,
      customers,
      hasMore: result.data.customers.pageInfo.hasNextPage,
    });
  }

  // --------------------------------------------------------------------------
  // Get Shop Info
  // --------------------------------------------------------------------------

  async getShop(): Promise<Result<GetShopResponse>> {
    const query = `
      query GetShop {
        shop {
          id
          name
          email
          domain
          primaryDomain {
            url
            host
          }
          currencyCode
          timezoneAbbreviation
          ianaTimezone
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          billingAddress {
            city
            province
            country
          }
        }
      }
    `;

    const result = await this.query<{ shop: ShopifyShop }>(query);

    if (!result.success) return result;

    return ok({ shop: result.data.shop });
  }

  // --------------------------------------------------------------------------
  // Get Single Product
  // --------------------------------------------------------------------------

  async getProduct(
    params: GetProductParams
  ): Promise<Result<GetProductResponse>> {
    const gid = params.id.startsWith("gid://")
      ? params.id
      : `gid://shopify/Product/${params.id}`;

    const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          vendor
          productType
          createdAt
          updatedAt
          totalInventory
          descriptionHtml
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          featuredImage { url altText }
          variants(first: 20) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryQuantity
              }
            }
          }
          tags
        }
      }
    `;

    const result = await this.query<{
      product: ShopifyProduct & {
        variants: { edges: Array<{ node: unknown }> };
      };
    }>(query, { id: gid });

    if (!result.success) return result;

    const product = {
      ...result.data.product,
      variants: result.data.product.variants?.edges?.map((v) => v.node) ?? [],
    };

    return ok({ product: product as ShopifyProduct });
  }

  // --------------------------------------------------------------------------
  // Get Single Order
  // --------------------------------------------------------------------------

  async getOrder(params: GetOrderParams): Promise<Result<GetOrderResponse>> {
    const gid = params.id.startsWith("gid://")
      ? params.id
      : `gid://shopify/Order/${params.id}`;

    const query = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          note
          tags
          totalPriceSet { shopMoney { amount currencyCode } }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          totalRefundedSet { shopMoney { amount currencyCode } }
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                variant { id sku }
                product { id title }
              }
            }
          }
          shippingAddress { city province country }
          customer { id email firstName lastName }
          fulfillments(first: 10) {
            id
            status
            trackingInfo { number url company }
          }
        }
      }
    `;

    const result = await this.query<{
      order: ShopifyOrder & { lineItems: { edges: Array<{ node: unknown }> } };
    }>(query, { id: gid });

    if (!result.success) return result;

    const order = {
      ...result.data.order,
      lineItems: result.data.order.lineItems?.edges?.map((li) => li.node) ?? [],
    };

    return ok({ order: order as ShopifyOrder });
  }

  // --------------------------------------------------------------------------
  // Get Dashboard KPIs
  // --------------------------------------------------------------------------

  async getDashboardKPIs(
    params: GetDashboardKPIsParams = {}
  ): Promise<Result<GetDashboardKPIsResponse>> {
    const period = params.period ?? "7d";

    // Calculate date ranges
    const now = new Date();
    const daysMap = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[period];

    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - days);

    // Query orders for both periods
    const query = `
      query GetOrdersForKPIs($currentStart: DateTime!, $previousStart: DateTime!) {
        shop { currencyCode }
        current: orders(first: 250, query: "created_at:>='${currentStart.toISOString()}'") {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
        previous: orders(first: 250, query: "created_at:>='${previousStart.toISOString()}' AND created_at:<'${currentStart.toISOString()}'") {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      shop: { currencyCode: string };
      current: {
        edges: Array<{
          node: { totalPriceSet: { shopMoney: { amount: string } } };
        }>;
      };
      previous: {
        edges: Array<{
          node: { totalPriceSet: { shopMoney: { amount: string } } };
        }>;
      };
    }>(query, {
      currentStart: currentStart.toISOString(),
      previousStart: previousStart.toISOString(),
    });

    if (!result.success) return result;

    // Calculate metrics
    const currentOrders = result.data.current.edges.length;
    const currentRevenue = result.data.current.edges.reduce(
      (sum, e) => sum + parseFloat(e.node.totalPriceSet.shopMoney.amount),
      0
    );
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const previousOrders = result.data.previous.edges.length;
    const previousRevenue = result.data.previous.edges.reduce(
      (sum, e) => sum + parseFloat(e.node.totalPriceSet.shopMoney.amount),
      0
    );
    const previousAOV =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;

    // Calculate changes
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : 0;
    const aovChange =
      previousAOV > 0 ? ((currentAOV - previousAOV) / previousAOV) * 100 : 0;

    return ok({
      kpis: {
        revenue: currentRevenue,
        orders: currentOrders,
        averageOrderValue: currentAOV,
        revenueChange: Math.round(revenueChange * 10) / 10,
        ordersChange: Math.round(ordersChange * 10) / 10,
        aovChange: Math.round(aovChange * 10) / 10,
        currencyCode: result.data.shop.currencyCode,
        period,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Get Revenue Trend
  // --------------------------------------------------------------------------

  async getRevenueTrend(
    params: GetRevenueTrendParams = {}
  ): Promise<Result<GetRevenueTrendResponse>> {
    const days = params.days ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      query GetRevenueTrend {
        shop { currencyCode }
        orders(first: 250, query: "created_at:>='${startDate.toISOString()}'", sortKey: CREATED_AT) {
          edges {
            node {
              createdAt
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      shop: { currencyCode: string };
      orders: {
        edges: Array<{
          node: {
            createdAt: string;
            totalPriceSet: { shopMoney: { amount: string } };
          };
        }>;
      };
    }>(query);

    if (!result.success) return result;

    // Group by day
    const dailyData = new Map<string, RevenueTrendDataPoint>();

    // Initialize all days with zero
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split("T")[0];
      if (dateStr) {
        dailyData.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
      }
    }

    // Aggregate orders
    for (const edge of result.data.orders.edges) {
      const dateStr = edge.node.createdAt.split("T")[0];
      if (dateStr) {
        const existing = dailyData.get(dateStr);
        if (existing) {
          existing.revenue += parseFloat(
            edge.node.totalPriceSet.shopMoney.amount
          );
          existing.orders += 1;
        }
      }
    }

    return ok({
      trend: Array.from(dailyData.values()),
      currencyCode: result.data.shop.currencyCode,
    });
  }

  // --------------------------------------------------------------------------
  // Get Low Stock Alerts
  // --------------------------------------------------------------------------

  async getLowStockAlerts(
    params: GetLowStockAlertsParams = {}
  ): Promise<Result<GetLowStockAlertsResponse>> {
    const threshold = params.threshold ?? 10;
    const limit = Math.min(params.limit ?? 20, 50);

    const query = `
      query GetLowStock($first: Int!) {
        products(first: $first, query: "total_inventory:<${threshold}") {
          edges {
            node {
              id
              title
              handle
              totalInventory
              featuredImage { url altText }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      products: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            totalInventory: number;
            featuredImage: { url: string; altText?: string } | null;
            variants: {
              edges: Array<{
                node: {
                  id: string;
                  title: string;
                  sku: string | null;
                  inventoryQuantity: number;
                };
              }>;
            };
          };
        }>;
      };
    }>(query, { first: limit });

    if (!result.success) return result;

    // Flatten to variant level for actionable alerts
    const alerts: LowStockProduct[] = [];
    for (const edge of result.data.products.edges) {
      for (const variantEdge of edge.node.variants.edges) {
        if (variantEdge.node.inventoryQuantity < threshold) {
          alerts.push({
            id: edge.node.id,
            title: edge.node.title,
            handle: edge.node.handle,
            totalInventory: edge.node.totalInventory,
            variantId: variantEdge.node.id,
            variantTitle: variantEdge.node.title,
            sku: variantEdge.node.sku,
            inventoryQuantity: variantEdge.node.inventoryQuantity,
            featuredImage: edge.node.featuredImage,
          });
        }
      }
    }

    return ok({
      alerts: alerts.slice(0, limit),
      count: alerts.length,
    });
  }

  // --------------------------------------------------------------------------
  // Get Action Queue
  // --------------------------------------------------------------------------

  async getActionQueue(
    params: GetActionQueueParams = {}
  ): Promise<Result<GetActionQueueResponse>> {
    const limit = params.limit ?? 20;

    // Query unfulfilled orders and pending payments
    const query = `
      query GetActionQueue {
        unfulfilled: orders(first: 50, query: "fulfillment_status:unfulfilled financial_status:paid") {
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { firstName lastName }
            }
          }
        }
        pendingPayment: orders(first: 50, query: "financial_status:pending") {
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet { shopMoney { amount currencyCode } }
            }
          }
        }
        lowStock: products(first: 20, query: "total_inventory:<5") {
          edges {
            node {
              id
              title
              totalInventory
            }
          }
        }
      }
    `;

    const result = await this.query<{
      unfulfilled: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            createdAt: string;
            totalPriceSet: {
              shopMoney: { amount: string; currencyCode: string };
            };
            customer?: { firstName?: string; lastName?: string };
          };
        }>;
      };
      pendingPayment: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            createdAt: string;
            totalPriceSet: {
              shopMoney: { amount: string; currencyCode: string };
            };
          };
        }>;
      };
      lowStock: {
        edges: Array<{
          node: { id: string; title: string; totalInventory: number };
        }>;
      };
    }>(query);

    if (!result.success) return result;

    const actions: ActionQueueItem[] = [];

    // Unfulfilled orders (high priority)
    for (const edge of result.data.unfulfilled.edges) {
      const customerName = edge.node.customer
        ? `${edge.node.customer.firstName ?? ""} ${
            edge.node.customer.lastName ?? ""
          }`.trim()
        : "Customer";
      actions.push({
        type: "unfulfilled_order",
        id: edge.node.id,
        title: `Fulfill order ${edge.node.name}`,
        description: `${customerName} - ${edge.node.totalPriceSet.shopMoney.currencyCode} ${edge.node.totalPriceSet.shopMoney.amount}`,
        priority: "high",
        createdAt: edge.node.createdAt,
        metadata: { orderId: edge.node.id, orderName: edge.node.name },
      });
    }

    // Pending payments (medium priority)
    for (const edge of result.data.pendingPayment.edges) {
      actions.push({
        type: "payment_pending",
        id: edge.node.id,
        title: `Payment pending for ${edge.node.name}`,
        description: `${edge.node.totalPriceSet.shopMoney.currencyCode} ${edge.node.totalPriceSet.shopMoney.amount}`,
        priority: "medium",
        createdAt: edge.node.createdAt,
        metadata: { orderId: edge.node.id, orderName: edge.node.name },
      });
    }

    // Low stock (medium priority)
    for (const edge of result.data.lowStock.edges) {
      actions.push({
        type: "low_stock",
        id: edge.node.id,
        title: `Low stock: ${edge.node.title}`,
        description: `Only ${edge.node.totalInventory} units remaining`,
        priority: edge.node.totalInventory === 0 ? "high" : "medium",
        createdAt: new Date().toISOString(),
        metadata: {
          productId: edge.node.id,
          inventory: edge.node.totalInventory,
        },
      });
    }

    // Sort by priority then date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return ok({
      actions: actions.slice(0, limit),
      count: actions.length,
    });
  }

  // --------------------------------------------------------------------------
  // Get Top Products
  // --------------------------------------------------------------------------

  async getTopProducts(
    params: GetTopProductsParams = {}
  ): Promise<Result<GetTopProductsResponse>> {
    const limit = Math.min(params.limit ?? 10, 50);
    const period = params.period ?? "30d";

    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysMap[period]);

    // Get orders with line items to calculate top products
    const query = `
      query GetOrdersForTopProducts {
        shop { currencyCode }
        orders(first: 250, query: "created_at:>='${startDate.toISOString()}'") {
          edges {
            node {
              lineItems(first: 50) {
                edges {
                  node {
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    product {
                      id
                      title
                      handle
                      featuredImage { url altText }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      shop: { currencyCode: string };
      orders: {
        edges: Array<{
          node: {
            lineItems: {
              edges: Array<{
                node: {
                  quantity: number;
                  originalUnitPriceSet: { shopMoney: { amount: string } };
                  product: {
                    id: string;
                    title: string;
                    handle: string;
                    featuredImage: { url: string; altText?: string } | null;
                  };
                };
              }>;
            };
          };
        }>;
      };
    }>(query);

    if (!result.success) return result;

    // Aggregate sales by product
    const productSales = new Map<
      string,
      {
        id: string;
        title: string;
        handle: string;
        totalSales: number;
        totalRevenue: number;
        featuredImage: { url: string; altText?: string } | null;
      }
    >();

    for (const orderEdge of result.data.orders.edges) {
      for (const lineItemEdge of orderEdge.node.lineItems.edges) {
        const product = lineItemEdge.node.product;
        if (!product) continue;

        const existing = productSales.get(product.id) ?? {
          id: product.id,
          title: product.title,
          handle: product.handle,
          totalSales: 0,
          totalRevenue: 0,
          featuredImage: product.featuredImage,
        };

        existing.totalSales += lineItemEdge.node.quantity;
        existing.totalRevenue +=
          lineItemEdge.node.quantity *
          parseFloat(lineItemEdge.node.originalUnitPriceSet.shopMoney.amount);
        productSales.set(product.id, existing);
      }
    }

    // Sort by revenue and take top N
    const sortedProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return ok({
      products: sortedProducts,
      currencyCode: result.data.shop.currencyCode,
    });
  }

  // --------------------------------------------------------------------------
  // Get Collections
  // --------------------------------------------------------------------------

  async getCollections(
    params: GetCollectionsParams = {}
  ): Promise<Result<GetCollectionsResponse>> {
    const limit = Math.min(params.limit ?? 20, 50);
    const queryFilter = params.query ? `, query: "${params.query}"` : "";

    const query = `
      query GetCollections($first: Int!) {
        collections(first: $first${queryFilter}) {
          edges {
            node {
              id
              title
              handle
              description
              productsCount
              image { url altText }
              sortOrder
            }
          }
          pageInfo { hasNextPage }
        }
      }
    `;

    const result = await this.query<{
      collections: {
        edges: Array<{ node: ShopifyCollection }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: limit });

    if (!result.success) return result;

    const collections = result.data.collections.edges.map((e) => e.node);

    return ok({
      collections,
      count: collections.length,
      hasMore: result.data.collections.pageInfo.hasNextPage,
    });
  }

  // --------------------------------------------------------------------------
  // Get Locations
  // --------------------------------------------------------------------------

  async getLocations(): Promise<Result<GetLocationsResponse>> {
    const query = `
      query GetLocations {
        locations(first: 50) {
          edges {
            node {
              id
              name
              isActive
              fulfillsOnlineOrders
              address {
                city
                province
                country
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      locations: { edges: Array<{ node: ShopifyLocation }> };
    }>(query);

    if (!result.success) return result;

    const locations = result.data.locations.edges.map((e) => e.node);

    return ok({
      locations,
      count: locations.length,
    });
  }

  // --------------------------------------------------------------------------
  // Get Inventory Levels
  // --------------------------------------------------------------------------

  async getInventoryLevels(
    params: GetInventoryLevelsParams = {}
  ): Promise<Result<GetInventoryLevelsResponse>> {
    const limit = Math.min(params.limit ?? 50, 100);
    let productFilter = "";
    if (params.productId) {
      const gid = params.productId.startsWith("gid://")
        ? params.productId
        : `gid://shopify/Product/${params.productId}`;
      productFilter = `, query: "product_id:${gid.split("/").pop()}"`;
    }

    const query = `
      query GetInventory($first: Int!) {
        productVariants(first: $first${productFilter}) {
          edges {
            node {
              id
              title
              sku
              product { id title }
              inventoryItem {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id
                      available
                      incoming
                      location { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      productVariants: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            sku: string | null;
            product: { id: string; title: string };
            inventoryItem: {
              id: string;
              inventoryLevels: {
                edges: Array<{
                  node: {
                    id: string;
                    available: number;
                    incoming: number;
                    location: { id: string; name: string };
                  };
                }>;
              };
            };
          };
        }>;
      };
    }>(query, { first: limit });

    if (!result.success) return result;

    const inventory: ProductInventory[] = result.data.productVariants.edges.map(
      (edge) => {
        const levels = edge.node.inventoryItem.inventoryLevels.edges.map(
          (l) => ({
            id: l.node.id,
            locationId: l.node.location.id,
            locationName: l.node.location.name,
            available: l.node.available,
            incoming: l.node.incoming,
            reserved: 0, // Calculated separately if needed
          })
        );

        return {
          productId: edge.node.product.id,
          productTitle: edge.node.product.title,
          variantId: edge.node.id,
          variantTitle: edge.node.title,
          sku: edge.node.sku,
          levels,
          totalAvailable: levels.reduce((sum, l) => sum + l.available, 0),
        };
      }
    );

    return ok({
      inventory,
      count: inventory.length,
    });
  }

  // --------------------------------------------------------------------------
  // Get Discount Codes
  // --------------------------------------------------------------------------

  async getDiscountCodes(
    params: GetDiscountCodesParams = {}
  ): Promise<Result<GetDiscountCodesResponse>> {
    const limit = Math.min(params.limit ?? 20, 50);
    const queryFilter = params.query ? `, query: "${params.query}"` : "";

    const query = `
      query GetDiscounts($first: Int!) {
        codeDiscountNodes(first: $first${queryFilter}) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  status
                  startsAt
                  endsAt
                  usageLimit
                  asyncUsageCount
                  codes(first: 1) {
                    edges { node { code } }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  startsAt
                  endsAt
                  usageLimit
                  asyncUsageCount
                  codes(first: 1) {
                    edges { node { code } }
                  }
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  startsAt
                  endsAt
                  usageLimit
                  asyncUsageCount
                  codes(first: 1) {
                    edges { node { code } }
                  }
                }
              }
            }
          }
          pageInfo { hasNextPage }
        }
      }
    `;

    const result = await this.query<{
      codeDiscountNodes: {
        edges: Array<{
          node: {
            id: string;
            codeDiscount: {
              title?: string;
              status?: string;
              startsAt?: string;
              endsAt?: string;
              usageLimit?: number;
              asyncUsageCount?: number;
              codes?: { edges: Array<{ node: { code: string } }> };
            };
          };
        }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: limit });

    if (!result.success) return result;

    const discounts: ShopifyDiscountCode[] = result.data.codeDiscountNodes.edges
      .filter((e) => e.node.codeDiscount.codes?.edges?.[0])
      .map((e) => ({
        id: e.node.id,
        code: e.node.codeDiscount.codes?.edges?.[0]?.node?.code ?? "",
        title: e.node.codeDiscount.title,
        status: e.node.codeDiscount.status ?? "UNKNOWN",
        startsAt: e.node.codeDiscount.startsAt,
        endsAt: e.node.codeDiscount.endsAt,
        usageLimit: e.node.codeDiscount.usageLimit,
        asyncUsageCount: e.node.codeDiscount.asyncUsageCount,
      }));

    return ok({
      discounts,
      count: discounts.length,
      hasMore: result.data.codeDiscountNodes.pageInfo.hasNextPage,
    });
  }

  // --------------------------------------------------------------------------
  // Fulfill Order
  // --------------------------------------------------------------------------

  async fulfillOrder(
    params: FulfillOrderParams
  ): Promise<Result<FulfillOrderResponse>> {
    const gid = params.orderId.startsWith("gid://")
      ? params.orderId
      : `gid://shopify/Order/${params.orderId}`;

    // First get the fulfillment order
    const getFulfillmentOrderQuery = `
      query GetFulfillmentOrder($orderId: ID!) {
        order(id: $orderId) {
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
              }
            }
          }
        }
      }
    `;

    const foResult = await this.query<{
      order: {
        fulfillmentOrders: {
          edges: Array<{ node: { id: string; status: string } }>;
        };
      };
    }>(getFulfillmentOrderQuery, { orderId: gid });

    if (!foResult.success) return foResult;

    const openFO = foResult.data.order.fulfillmentOrders.edges.find(
      (e) => e.node.status === "OPEN" || e.node.status === "IN_PROGRESS"
    );

    if (!openFO) {
      return ok({ success: false, fulfillmentId: "" });
    }

    // Create fulfillment
    const mutation = `
      mutation CreateFulfillment($fulfillment: FulfillmentInput!) {
        fulfillmentCreate(fulfillment: $fulfillment) {
          fulfillment {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const trackingInfo = params.trackingNumber
      ? {
          number: params.trackingNumber,
          url: params.trackingUrl,
          company: params.trackingCompany,
        }
      : undefined;

    const result = await this.query<{
      fulfillmentCreate: {
        fulfillment: { id: string } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, {
      fulfillment: {
        lineItemsByFulfillmentOrder: [
          {
            fulfillmentOrderId: openFO.node.id,
          },
        ],
        notifyCustomer: params.notifyCustomer ?? true,
        trackingInfo,
      },
    });

    if (!result.success) return result;

    if (result.data.fulfillmentCreate.userErrors.length > 0) {
      return ok({
        success: false,
        fulfillmentId: "",
      });
    }

    return ok({
      success: true,
      fulfillmentId: result.data.fulfillmentCreate.fulfillment?.id ?? "",
    });
  }

  // --------------------------------------------------------------------------
  // Update Product
  // --------------------------------------------------------------------------

  async updateProduct(
    params: UpdateProductParams
  ): Promise<Result<UpdateProductResponse>> {
    const gid = params.id.startsWith("gid://")
      ? params.id
      : `gid://shopify/Product/${params.id}`;

    const mutation = `
      mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
            vendor
            productType
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = { id: gid };
    if (params.title) input.title = params.title;
    if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
    if (params.status) input.status = params.status;
    if (params.vendor) input.vendor = params.vendor;
    if (params.productType) input.productType = params.productType;
    if (params.tags) input.tags = params.tags;

    const result = await this.query<{
      productUpdate: {
        product: ShopifyProduct | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { input });

    if (!result.success) return result;

    if (
      result.data.productUpdate.userErrors.length > 0 ||
      !result.data.productUpdate.product
    ) {
      return ok({
        success: false,
        product: {} as ShopifyProduct,
      });
    }

    return ok({
      success: true,
      product: result.data.productUpdate.product,
    });
  }

  // --------------------------------------------------------------------------
  // Create Product
  // --------------------------------------------------------------------------

  async createProduct(
    params: CreateProductParams
  ): Promise<Result<CreateProductResponse>> {
    const mutation = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            vendor
            productType
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = {
      title: params.title,
      status: params.status ?? "DRAFT",
    };
    if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
    if (params.vendor) input.vendor = params.vendor;
    if (params.productType) input.productType = params.productType;
    if (params.tags) input.tags = params.tags;

    const result = await this.query<{
      productCreate: {
        product: ShopifyProduct | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { input });

    if (!result.success) return result;

    if (
      result.data.productCreate.userErrors.length > 0 ||
      !result.data.productCreate.product
    ) {
      return ok({
        success: false,
        product: {} as ShopifyProduct,
      });
    }

    return ok({
      success: true,
      product: result.data.productCreate.product,
    });
  }

  // --------------------------------------------------------------------------
  // Adjust Inventory
  // --------------------------------------------------------------------------

  async adjustInventory(
    params: AdjustInventoryParams
  ): Promise<Result<AdjustInventoryResponse>> {
    const mutation = `
      mutation AdjustInventory($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
          inventoryLevel {
            available
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query<{
      inventoryAdjustQuantity: {
        inventoryLevel: { available: number } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, {
      input: {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        availableDelta: params.delta,
      },
    });

    if (!result.success) return result;

    if (result.data.inventoryAdjustQuantity.userErrors.length > 0) {
      return ok({
        success: false,
        newAvailable: 0,
      });
    }

    return ok({
      success: true,
      newAvailable:
        result.data.inventoryAdjustQuantity.inventoryLevel?.available ?? 0,
    });
  }

  // --------------------------------------------------------------------------
  // Create Collection
  // --------------------------------------------------------------------------

  async createCollection(params: {
    title: string;
    descriptionHtml?: string;
    ruleSet?: {
      appliedDisjunctively: boolean;
      rules: Array<{ column: string; relation: string; condition: string }>;
    };
    sortOrder?: string;
    templateSuffix?: string;
    image?: { src: string; altText?: string };
  }): Promise<Result<{ success: boolean; collection: ShopifyCollection }>> {
    const mutation = `
      mutation CollectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            title
            handle
            descriptionHtml
            productsCount { count }
            sortOrder
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = {
      title: params.title,
    };
    if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
    if (params.ruleSet) input.ruleSet = params.ruleSet;
    if (params.sortOrder) input.sortOrder = params.sortOrder;
    if (params.templateSuffix) input.templateSuffix = params.templateSuffix;
    if (params.image) input.image = params.image;

    const result = await this.query<{
      collectionCreate: {
        collection: ShopifyCollection | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { input });

    if (!result.success) return result;

    if (
      result.data.collectionCreate.userErrors.length > 0 ||
      !result.data.collectionCreate.collection
    ) {
      return ok({
        success: false,
        collection: {} as ShopifyCollection,
      });
    }

    return ok({
      success: true,
      collection: result.data.collectionCreate.collection,
    });
  }

  // --------------------------------------------------------------------------
  // Update Collection
  // --------------------------------------------------------------------------

  async updateCollection(params: {
    id: string;
    title?: string;
    descriptionHtml?: string;
    sortOrder?: string;
    templateSuffix?: string;
    image?: { src: string; altText?: string };
  }): Promise<Result<{ success: boolean; collection: ShopifyCollection }>> {
    const gid = params.id.startsWith("gid://")
      ? params.id
      : `gid://shopify/Collection/${params.id}`;

    const mutation = `
      mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection {
            id
            title
            handle
            descriptionHtml
            productsCount { count }
            sortOrder
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = { id: gid };
    if (params.title) input.title = params.title;
    if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
    if (params.sortOrder) input.sortOrder = params.sortOrder;
    if (params.templateSuffix) input.templateSuffix = params.templateSuffix;
    if (params.image) input.image = params.image;

    const result = await this.query<{
      collectionUpdate: {
        collection: ShopifyCollection | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { input });

    if (!result.success) return result;

    if (
      result.data.collectionUpdate.userErrors.length > 0 ||
      !result.data.collectionUpdate.collection
    ) {
      return ok({
        success: false,
        collection: {} as ShopifyCollection,
      });
    }

    return ok({
      success: true,
      collection: result.data.collectionUpdate.collection,
    });
  }

  // --------------------------------------------------------------------------
  // Add Products to Collection
  // --------------------------------------------------------------------------

  async addProductsToCollection(params: {
    collectionId: string;
    productIds: string[];
  }): Promise<Result<{ success: boolean; addedCount: number }>> {
    const collectionGid = params.collectionId.startsWith("gid://")
      ? params.collectionId
      : `gid://shopify/Collection/${params.collectionId}`;

    const productGids = params.productIds.map((id) =>
      id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`
    );

    const mutation = `
      mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection {
            id
            title
            productsCount { count }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query<{
      collectionAddProducts: {
        collection: {
          id: string;
          title: string;
          productsCount: { count: number };
        } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { id: collectionGid, productIds: productGids });

    if (!result.success) return result;

    if (result.data.collectionAddProducts.userErrors.length > 0) {
      return ok({
        success: false,
        addedCount: 0,
      });
    }

    return ok({
      success: true,
      addedCount: productGids.length,
    });
  }

  // --------------------------------------------------------------------------
  // Remove Products from Collection
  // --------------------------------------------------------------------------

  async removeProductsFromCollection(params: {
    collectionId: string;
    productIds: string[];
  }): Promise<Result<{ success: boolean; removedCount: number }>> {
    const collectionGid = params.collectionId.startsWith("gid://")
      ? params.collectionId
      : `gid://shopify/Collection/${params.collectionId}`;

    const productGids = params.productIds.map((id) =>
      id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`
    );

    const mutation = `
      mutation CollectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
        collectionRemoveProducts(id: $id, productIds: $productIds) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query<{
      collectionRemoveProducts: {
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { id: collectionGid, productIds: productGids });

    if (!result.success) return result;

    if (result.data.collectionRemoveProducts.userErrors.length > 0) {
      return ok({
        success: false,
        removedCount: 0,
      });
    }

    return ok({
      success: true,
      removedCount: productGids.length,
    });
  }

  // --------------------------------------------------------------------------
  // Delete Product
  // --------------------------------------------------------------------------

  async deleteProduct(params: {
    id: string;
  }): Promise<Result<{ success: boolean; deletedProductId: string }>> {
    const gid = params.id.startsWith("gid://")
      ? params.id
      : `gid://shopify/Product/${params.id}`;

    const mutation = `
      mutation ProductDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query<{
      productDelete: {
        deletedProductId: string | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(mutation, { input: { id: gid } });

    if (!result.success) return result;

    if (
      result.data.productDelete.userErrors.length > 0 ||
      !result.data.productDelete.deletedProductId
    ) {
      return ok({
        success: false,
        deletedProductId: "",
      });
    }

    return ok({
      success: true,
      deletedProductId: result.data.productDelete.deletedProductId,
    });
  }

  // --------------------------------------------------------------------------
  // GraphQL Helper
  // --------------------------------------------------------------------------

  private async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<Result<T>> {
    if (this.debug) {
      console.log("[ShopifyClient] Query:", query.trim().substring(0, 100));
      console.log("[ShopifyClient] Variables:", variables);
    }

    return graphqlRequest<T>(
      this.apiUrl,
      query,
      variables,
      { "X-Shopify-Access-Token": this.accessToken },
      this.fetchFn,
      this.timeout
    );
  }
}
