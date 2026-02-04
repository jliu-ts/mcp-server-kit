/**
 * Stripe Integration
 *
 * Runtime-agnostic client for Stripe's REST API.
 * Supports customers, products, prices, subscriptions, invoices, and payments.
 *
 * @example
 * import { StripeClient, createStripeTools } from '@trendingsociety/integrations/stripe'
 *
 * const client = new StripeClient({
 *   secretKey: process.env.STRIPE_SECRET_KEY,
 * })
 *
 * // Direct client usage
 * const customers = await client.listCustomers({ limit: 10 })
 *
 * // AI SDK tools usage
 * const tools = createStripeTools(client)
 */

export { StripeClient, type StripeClientConfig } from './client.js'
export { createStripeTools, type StripeTools } from './tools.js'
export type {
  // Core types
  Money,
  Address,
  Metadata,
  // Customers
  StripeCustomer,
  ListCustomersParams,
  ListCustomersResponse,
  GetCustomerParams,
  GetCustomerResponse,
  CreateCustomerParams,
  CreateCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerResponse,
  // Products
  StripeProduct,
  ListProductsParams,
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
  CreateProductParams,
  CreateProductResponse,
  UpdateProductParams,
  UpdateProductResponse,
  // Prices
  StripePrice,
  ListPricesParams,
  ListPricesResponse,
  GetPriceParams,
  GetPriceResponse,
  CreatePriceParams,
  CreatePriceResponse,
  // Payment Intents
  PaymentIntentStatus,
  StripePaymentIntent,
  ListPaymentIntentsParams,
  ListPaymentIntentsResponse,
  GetPaymentIntentParams,
  GetPaymentIntentResponse,
  CreatePaymentIntentParams,
  CreatePaymentIntentResponse,
  CapturePaymentIntentParams,
  CapturePaymentIntentResponse,
  CancelPaymentIntentParams,
  CancelPaymentIntentResponse,
  // Subscriptions
  SubscriptionStatus,
  StripeSubscription,
  ListSubscriptionsParams,
  ListSubscriptionsResponse,
  GetSubscriptionParams,
  GetSubscriptionResponse,
  CreateSubscriptionParams,
  CreateSubscriptionResponse,
  UpdateSubscriptionParams,
  UpdateSubscriptionResponse,
  CancelSubscriptionParams,
  CancelSubscriptionResponse,
  // Invoices
  InvoiceStatus,
  StripeInvoice,
  ListInvoicesParams,
  ListInvoicesResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  CreateInvoiceParams,
  CreateInvoiceResponse,
  FinalizeInvoiceParams,
  FinalizeInvoiceResponse,
  PayInvoiceParams,
  PayInvoiceResponse,
  VoidInvoiceParams,
  VoidInvoiceResponse,
  // Refunds
  RefundStatus,
  StripeRefund,
  ListRefundsParams,
  ListRefundsResponse,
  CreateRefundParams,
  CreateRefundResponse,
  // Balance
  StripeBalance,
  GetBalanceResponse,
  StripeBalanceTransaction,
  ListBalanceTransactionsParams,
  ListBalanceTransactionsResponse,
  // Charges
  StripeCharge,
  ListChargesParams,
  ListChargesResponse,
  GetChargeParams,
  GetChargeResponse,
  // Webhooks
  StripeWebhookEndpoint,
  ListWebhookEndpointsParams,
  ListWebhookEndpointsResponse,
} from './types.js'
