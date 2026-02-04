/**
 * Stripe AI SDK Tools
 *
 * AI SDK 6 native tool definitions for Stripe operations.
 * Single source of truth - used by both MCP server and AI SDK agents.
 *
 * @example
 * import { createStripeTools } from '@trendingsociety/integrations/stripe'
 * import { StripeClient } from '@trendingsociety/integrations/stripe'
 *
 * const client = new StripeClient({
 *   secretKey: process.env.STRIPE_SECRET_KEY,
 * })
 * const tools = createStripeTools(client)
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { StripeClient } from './client.js'

// ============================================================================
// Input Schemas
// ============================================================================

// Customers
export const ListCustomersInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max customers to return (max 100)'),
  email: z.string().optional().describe('Filter by email address'),
})

export const GetCustomerInputSchema = z.object({
  id: z.string().describe('Customer ID (cus_xxx)'),
})

export const CreateCustomerInputSchema = z.object({
  email: z.string().optional().describe('Customer email address'),
  name: z.string().optional().describe('Customer name'),
  phone: z.string().optional().describe('Customer phone number'),
  description: z.string().optional().describe('Description of the customer'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

export const UpdateCustomerInputSchema = z.object({
  id: z.string().describe('Customer ID to update'),
  email: z.string().optional().describe('New email address'),
  name: z.string().optional().describe('New name'),
  phone: z.string().optional().describe('New phone number'),
  description: z.string().optional().describe('New description'),
  metadata: z.record(z.string()).optional().describe('New metadata (replaces existing)'),
})

// Products
export const ListProductsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max products to return (max 100)'),
  active: z.boolean().optional().describe('Filter by active status'),
})

export const GetProductInputSchema = z.object({
  id: z.string().describe('Product ID (prod_xxx)'),
})

export const CreateProductInputSchema = z.object({
  name: z.string().describe('Product name'),
  description: z.string().optional().describe('Product description'),
  active: z.boolean().optional().default(true).describe('Whether product is active'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

export const UpdateProductInputSchema = z.object({
  id: z.string().describe('Product ID to update'),
  name: z.string().optional().describe('New product name'),
  description: z.string().optional().describe('New description'),
  active: z.boolean().optional().describe('Active status'),
  metadata: z.record(z.string()).optional().describe('New metadata'),
})

// Prices
export const ListPricesInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max prices to return'),
  product: z.string().optional().describe('Filter by product ID'),
  active: z.boolean().optional().describe('Filter by active status'),
  type: z.enum(['one_time', 'recurring']).optional().describe('Filter by price type'),
})

export const GetPriceInputSchema = z.object({
  id: z.string().describe('Price ID (price_xxx)'),
})

export const CreatePriceInputSchema = z.object({
  product: z.string().describe('Product ID for this price'),
  currency: z.string().describe('Three-letter currency code (e.g., usd)'),
  unit_amount: z.number().describe('Price in cents (e.g., 1999 for $19.99)'),
  recurring: z
    .object({
      interval: z.enum(['day', 'week', 'month', 'year']).describe('Billing interval'),
      interval_count: z.number().optional().describe('Number of intervals between billings'),
    })
    .optional()
    .describe('Recurring billing settings (omit for one-time)'),
  nickname: z.string().optional().describe('Price nickname for dashboard'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

// Payment Intents
export const ListPaymentIntentsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max payment intents to return'),
  customer: z.string().optional().describe('Filter by customer ID'),
})

export const GetPaymentIntentInputSchema = z.object({
  id: z.string().describe('Payment Intent ID (pi_xxx)'),
})

export const CreatePaymentIntentInputSchema = z.object({
  amount: z.number().describe('Amount in cents'),
  currency: z.string().describe('Three-letter currency code'),
  customer: z.string().optional().describe('Customer ID to attach'),
  description: z.string().optional().describe('Payment description'),
  receipt_email: z.string().optional().describe('Email for receipt'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

export const CapturePaymentIntentInputSchema = z.object({
  id: z.string().describe('Payment Intent ID to capture'),
  amount_to_capture: z.number().optional().describe('Amount to capture (defaults to full amount)'),
})

export const CancelPaymentIntentInputSchema = z.object({
  id: z.string().describe('Payment Intent ID to cancel'),
  cancellation_reason: z
    .enum(['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned'])
    .optional()
    .describe('Reason for cancellation'),
})

// Subscriptions
export const ListSubscriptionsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max subscriptions to return'),
  customer: z.string().optional().describe('Filter by customer ID'),
  status: z
    .enum(['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'trialing', 'paused', 'all'])
    .optional()
    .describe('Filter by status'),
  price: z.string().optional().describe('Filter by price ID'),
})

export const GetSubscriptionInputSchema = z.object({
  id: z.string().describe('Subscription ID (sub_xxx)'),
})

export const CreateSubscriptionInputSchema = z.object({
  customer: z.string().describe('Customer ID'),
  items: z
    .array(
      z.object({
        price: z.string().describe('Price ID'),
        quantity: z.number().optional().describe('Quantity'),
      })
    )
    .describe('Subscription items (prices to subscribe to)'),
  trial_period_days: z.number().optional().describe('Days of free trial'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
  cancel_at_period_end: z.boolean().optional().describe('Cancel at end of period'),
})

export const UpdateSubscriptionInputSchema = z.object({
  id: z.string().describe('Subscription ID to update'),
  items: z
    .array(
      z.object({
        id: z.string().optional().describe('Subscription item ID (for updates)'),
        price: z.string().optional().describe('New price ID'),
        quantity: z.number().optional().describe('New quantity'),
        deleted: z.boolean().optional().describe('Remove this item'),
      })
    )
    .optional()
    .describe('Updated subscription items'),
  metadata: z.record(z.string()).optional().describe('New metadata'),
  cancel_at_period_end: z.boolean().optional().describe('Cancel at end of period'),
  proration_behavior: z
    .enum(['create_prorations', 'none', 'always_invoice'])
    .optional()
    .describe('Proration behavior'),
})

export const CancelSubscriptionInputSchema = z.object({
  id: z.string().describe('Subscription ID to cancel'),
  invoice_now: z.boolean().optional().describe('Generate final invoice immediately'),
  prorate: z.boolean().optional().describe('Prorate final invoice'),
})

// Invoices
export const ListInvoicesInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max invoices to return'),
  customer: z.string().optional().describe('Filter by customer ID'),
  subscription: z.string().optional().describe('Filter by subscription ID'),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']).optional().describe('Filter by status'),
})

export const GetInvoiceInputSchema = z.object({
  id: z.string().describe('Invoice ID (in_xxx)'),
})

export const CreateInvoiceInputSchema = z.object({
  customer: z.string().describe('Customer ID'),
  subscription: z.string().optional().describe('Subscription ID'),
  description: z.string().optional().describe('Invoice description'),
  auto_advance: z.boolean().optional().describe('Auto-finalize and send'),
  collection_method: z
    .enum(['charge_automatically', 'send_invoice'])
    .optional()
    .describe('How to collect payment'),
  days_until_due: z.number().optional().describe('Days until due (for send_invoice)'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

export const FinalizeInvoiceInputSchema = z.object({
  id: z.string().describe('Invoice ID to finalize'),
  auto_advance: z.boolean().optional().describe('Auto-send after finalizing'),
})

export const PayInvoiceInputSchema = z.object({
  id: z.string().describe('Invoice ID to pay'),
  payment_method: z.string().optional().describe('Payment method ID'),
})

export const VoidInvoiceInputSchema = z.object({
  id: z.string().describe('Invoice ID to void'),
})

// Refunds
export const ListRefundsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max refunds to return'),
  payment_intent: z.string().optional().describe('Filter by payment intent ID'),
  charge: z.string().optional().describe('Filter by charge ID'),
})

export const CreateRefundInputSchema = z.object({
  payment_intent: z.string().optional().describe('Payment Intent ID to refund'),
  charge: z.string().optional().describe('Charge ID to refund (alternative to payment_intent)'),
  amount: z.number().optional().describe('Amount to refund in cents (defaults to full amount)'),
  reason: z
    .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
    .optional()
    .describe('Reason for refund'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata'),
})

// Balance
export const ListBalanceTransactionsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max transactions to return'),
  type: z.string().optional().describe('Filter by transaction type'),
})

// Charges
export const ListChargesInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max charges to return'),
  customer: z.string().optional().describe('Filter by customer ID'),
  payment_intent: z.string().optional().describe('Filter by payment intent ID'),
})

export const GetChargeInputSchema = z.object({
  id: z.string().describe('Charge ID (ch_xxx)'),
})

// Webhooks
export const ListWebhookEndpointsInputSchema = z.object({
  limit: z.number().optional().default(10).describe('Max webhook endpoints to return'),
})

// ============================================================================
// Tool Factory
// ============================================================================

export type StripeTools = ReturnType<typeof createStripeTools>

/**
 * Create AI SDK tools for Stripe operations
 *
 * @param client - Initialized StripeClient instance
 * @returns Object containing all Stripe tools (27 tools)
 */
export function createStripeTools(client: StripeClient) {
  return {
    // =========================================================================
    // Customers (4 tools)
    // =========================================================================

    stripe_list_customers: tool({
      description: 'List Stripe customers with optional email filter',
      inputSchema: ListCustomersInputSchema,
      execute: async (params) => {
        const result = await client.listCustomers(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_customer: tool({
      description: 'Get a specific Stripe customer by ID',
      inputSchema: GetCustomerInputSchema,
      execute: async (params) => {
        const result = await client.getCustomer(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_customer: tool({
      description: 'Create a new Stripe customer',
      inputSchema: CreateCustomerInputSchema,
      execute: async (params) => {
        const result = await client.createCustomer(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_update_customer: tool({
      description: 'Update an existing Stripe customer',
      inputSchema: UpdateCustomerInputSchema,
      execute: async (params) => {
        const result = await client.updateCustomer(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Products (4 tools)
    // =========================================================================

    stripe_list_products: tool({
      description: 'List Stripe products',
      inputSchema: ListProductsInputSchema,
      execute: async (params) => {
        const result = await client.listProducts(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_product: tool({
      description: 'Get a specific Stripe product by ID',
      inputSchema: GetProductInputSchema,
      execute: async (params) => {
        const result = await client.getProduct(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_product: tool({
      description: 'Create a new Stripe product',
      inputSchema: CreateProductInputSchema,
      execute: async (params) => {
        const result = await client.createProduct(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_update_product: tool({
      description: 'Update an existing Stripe product',
      inputSchema: UpdateProductInputSchema,
      execute: async (params) => {
        const result = await client.updateProduct(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Prices (3 tools)
    // =========================================================================

    stripe_list_prices: tool({
      description: 'List Stripe prices (one-time or recurring)',
      inputSchema: ListPricesInputSchema,
      execute: async (params) => {
        const result = await client.listPrices(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_price: tool({
      description: 'Get a specific Stripe price by ID',
      inputSchema: GetPriceInputSchema,
      execute: async (params) => {
        const result = await client.getPrice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_price: tool({
      description: 'Create a new Stripe price for a product',
      inputSchema: CreatePriceInputSchema,
      execute: async (params) => {
        const result = await client.createPrice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Payment Intents (5 tools)
    // =========================================================================

    stripe_list_payment_intents: tool({
      description: 'List Stripe payment intents',
      inputSchema: ListPaymentIntentsInputSchema,
      execute: async (params) => {
        const result = await client.listPaymentIntents(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_payment_intent: tool({
      description: 'Get a specific payment intent by ID',
      inputSchema: GetPaymentIntentInputSchema,
      execute: async (params) => {
        const result = await client.getPaymentIntent(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_payment_intent: tool({
      description: 'Create a new payment intent for collecting payment',
      inputSchema: CreatePaymentIntentInputSchema,
      execute: async (params) => {
        const result = await client.createPaymentIntent(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_capture_payment_intent: tool({
      description: 'Capture an authorized payment intent',
      inputSchema: CapturePaymentIntentInputSchema,
      execute: async (params) => {
        const result = await client.capturePaymentIntent(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_cancel_payment_intent: tool({
      description: 'Cancel a payment intent',
      inputSchema: CancelPaymentIntentInputSchema,
      execute: async (params) => {
        const result = await client.cancelPaymentIntent(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Subscriptions (5 tools)
    // =========================================================================

    stripe_list_subscriptions: tool({
      description: 'List Stripe subscriptions with optional filters',
      inputSchema: ListSubscriptionsInputSchema,
      execute: async (params) => {
        const result = await client.listSubscriptions(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_subscription: tool({
      description: 'Get a specific subscription by ID',
      inputSchema: GetSubscriptionInputSchema,
      execute: async (params) => {
        const result = await client.getSubscription(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_subscription: tool({
      description: 'Create a new subscription for a customer',
      inputSchema: CreateSubscriptionInputSchema,
      execute: async (params) => {
        const result = await client.createSubscription(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_update_subscription: tool({
      description: 'Update an existing subscription (change plan, quantity, etc.)',
      inputSchema: UpdateSubscriptionInputSchema,
      execute: async (params) => {
        const result = await client.updateSubscription(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_cancel_subscription: tool({
      description: 'Cancel a subscription immediately or at period end',
      inputSchema: CancelSubscriptionInputSchema,
      execute: async (params) => {
        const result = await client.cancelSubscription(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Invoices (6 tools)
    // =========================================================================

    stripe_list_invoices: tool({
      description: 'List Stripe invoices with optional filters',
      inputSchema: ListInvoicesInputSchema,
      execute: async (params) => {
        const result = await client.listInvoices(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_invoice: tool({
      description: 'Get a specific invoice by ID',
      inputSchema: GetInvoiceInputSchema,
      execute: async (params) => {
        const result = await client.getInvoice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_invoice: tool({
      description: 'Create a new invoice for a customer',
      inputSchema: CreateInvoiceInputSchema,
      execute: async (params) => {
        const result = await client.createInvoice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_finalize_invoice: tool({
      description: 'Finalize a draft invoice (locks it for payment)',
      inputSchema: FinalizeInvoiceInputSchema,
      execute: async (params) => {
        const result = await client.finalizeInvoice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_pay_invoice: tool({
      description: 'Pay an open invoice using a payment method',
      inputSchema: PayInvoiceInputSchema,
      execute: async (params) => {
        const result = await client.payInvoice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_void_invoice: tool({
      description: 'Void an invoice (cannot be undone)',
      inputSchema: VoidInvoiceInputSchema,
      execute: async (params) => {
        const result = await client.voidInvoice(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Refunds (2 tools)
    // =========================================================================

    stripe_list_refunds: tool({
      description: 'List Stripe refunds',
      inputSchema: ListRefundsInputSchema,
      execute: async (params) => {
        const result = await client.listRefunds(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_create_refund: tool({
      description: 'Create a refund for a payment intent or charge',
      inputSchema: CreateRefundInputSchema,
      execute: async (params) => {
        const result = await client.createRefund(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Balance (2 tools)
    // =========================================================================

    stripe_get_balance: tool({
      description: 'Get current Stripe account balance',
      inputSchema: z.object({}),
      execute: async () => {
        const result = await client.getBalance()
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_list_balance_transactions: tool({
      description: 'List balance transactions (payouts, charges, refunds, etc.)',
      inputSchema: ListBalanceTransactionsInputSchema,
      execute: async (params) => {
        const result = await client.listBalanceTransactions(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Charges (2 tools)
    // =========================================================================

    stripe_list_charges: tool({
      description: 'List Stripe charges',
      inputSchema: ListChargesInputSchema,
      execute: async (params) => {
        const result = await client.listCharges(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    stripe_get_charge: tool({
      description: 'Get a specific charge by ID',
      inputSchema: GetChargeInputSchema,
      execute: async (params) => {
        const result = await client.getCharge(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),

    // =========================================================================
    // Webhooks (1 tool)
    // =========================================================================

    stripe_list_webhook_endpoints: tool({
      description: 'List configured webhook endpoints',
      inputSchema: ListWebhookEndpointsInputSchema,
      execute: async (params) => {
        const result = await client.listWebhookEndpoints(params)
        if (!result.success) throw new Error(result.error.message)
        return result.data
      },
    }),
  }
}
