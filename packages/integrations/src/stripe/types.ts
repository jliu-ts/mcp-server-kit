/**
 * Stripe Integration Types
 *
 * Type definitions for Stripe API responses and parameters.
 * Based on Stripe API 2024-11-20 version.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Money {
  amount: number
  currency: string
}

export interface Address {
  city?: string | null
  country?: string | null
  line1?: string | null
  line2?: string | null
  postal_code?: string | null
  state?: string | null
}

export interface Metadata {
  [key: string]: string
}

// ============================================================================
// Customer
// ============================================================================

export interface StripeCustomer {
  id: string
  object: 'customer'
  email?: string | null
  name?: string | null
  phone?: string | null
  description?: string | null
  address?: Address | null
  metadata: Metadata
  created: number
  livemode: boolean
  balance: number
  currency?: string | null
  default_source?: string | null
  delinquent: boolean
}

export interface ListCustomersParams {
  limit?: number
  email?: string
  starting_after?: string
  ending_before?: string
  created?: { gt?: number; gte?: number; lt?: number; lte?: number }
}

export interface ListCustomersResponse {
  count: number
  customers: StripeCustomer[]
  hasMore: boolean
}

export interface GetCustomerParams {
  id: string
}

export interface GetCustomerResponse {
  customer: StripeCustomer
}

export interface CreateCustomerParams {
  email?: string
  name?: string
  phone?: string
  description?: string
  metadata?: Metadata
  address?: Address
}

export interface CreateCustomerResponse {
  success: boolean
  customer: StripeCustomer
}

export interface UpdateCustomerParams {
  id: string
  email?: string
  name?: string
  phone?: string
  description?: string
  metadata?: Metadata
  address?: Address
}

export interface UpdateCustomerResponse {
  success: boolean
  customer: StripeCustomer
}

// ============================================================================
// Product
// ============================================================================

export interface StripeProduct {
  id: string
  object: 'product'
  name: string
  description?: string | null
  active: boolean
  metadata: Metadata
  created: number
  updated: number
  livemode: boolean
  default_price?: string | null
  images: string[]
  type: 'good' | 'service'
}

export interface ListProductsParams {
  limit?: number
  active?: boolean
  starting_after?: string
  ending_before?: string
}

export interface ListProductsResponse {
  count: number
  products: StripeProduct[]
  hasMore: boolean
}

export interface GetProductParams {
  id: string
}

export interface GetProductResponse {
  product: StripeProduct
}

export interface CreateProductParams {
  name: string
  description?: string
  active?: boolean
  metadata?: Metadata
  images?: string[]
  default_price_data?: {
    currency: string
    unit_amount: number
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year'
      interval_count?: number
    }
  }
}

export interface CreateProductResponse {
  success: boolean
  product: StripeProduct
}

export interface UpdateProductParams {
  id: string
  name?: string
  description?: string
  active?: boolean
  metadata?: Metadata
  images?: string[]
}

export interface UpdateProductResponse {
  success: boolean
  product: StripeProduct
}

// ============================================================================
// Price
// ============================================================================

export interface StripePrice {
  id: string
  object: 'price'
  product: string
  active: boolean
  currency: string
  unit_amount?: number | null
  unit_amount_decimal?: string | null
  type: 'one_time' | 'recurring'
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count: number
    usage_type: 'licensed' | 'metered'
  } | null
  metadata: Metadata
  created: number
  livemode: boolean
  billing_scheme: 'per_unit' | 'tiered'
  nickname?: string | null
}

export interface ListPricesParams {
  limit?: number
  product?: string
  active?: boolean
  type?: 'one_time' | 'recurring'
  starting_after?: string
}

export interface ListPricesResponse {
  count: number
  prices: StripePrice[]
  hasMore: boolean
}

export interface GetPriceParams {
  id: string
}

export interface GetPriceResponse {
  price: StripePrice
}

export interface CreatePriceParams {
  product: string
  currency: string
  unit_amount: number
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count?: number
  }
  metadata?: Metadata
  nickname?: string
}

export interface CreatePriceResponse {
  success: boolean
  price: StripePrice
}

// ============================================================================
// Payment Intent
// ============================================================================

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'

export interface StripePaymentIntent {
  id: string
  object: 'payment_intent'
  amount: number
  amount_received: number
  currency: string
  status: PaymentIntentStatus
  customer?: string | null
  description?: string | null
  metadata: Metadata
  created: number
  livemode: boolean
  payment_method?: string | null
  receipt_email?: string | null
  client_secret?: string | null
}

export interface ListPaymentIntentsParams {
  limit?: number
  customer?: string
  starting_after?: string
  created?: { gt?: number; gte?: number; lt?: number; lte?: number }
}

export interface ListPaymentIntentsResponse {
  count: number
  paymentIntents: StripePaymentIntent[]
  hasMore: boolean
}

export interface GetPaymentIntentParams {
  id: string
}

export interface GetPaymentIntentResponse {
  paymentIntent: StripePaymentIntent
}

export interface CreatePaymentIntentParams {
  amount: number
  currency: string
  customer?: string
  description?: string
  metadata?: Metadata
  receipt_email?: string
  automatic_payment_methods?: { enabled: boolean }
}

export interface CreatePaymentIntentResponse {
  success: boolean
  paymentIntent: StripePaymentIntent
}

export interface CapturePaymentIntentParams {
  id: string
  amount_to_capture?: number
}

export interface CapturePaymentIntentResponse {
  success: boolean
  paymentIntent: StripePaymentIntent
}

export interface CancelPaymentIntentParams {
  id: string
  cancellation_reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
}

export interface CancelPaymentIntentResponse {
  success: boolean
  paymentIntent: StripePaymentIntent
}

// ============================================================================
// Subscription
// ============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused'

export interface StripeSubscription {
  id: string
  object: 'subscription'
  customer: string
  status: SubscriptionStatus
  items: {
    data: Array<{
      id: string
      price: StripePrice
      quantity: number
    }>
  }
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at?: number | null
  ended_at?: number | null
  trial_start?: number | null
  trial_end?: number | null
  metadata: Metadata
  created: number
  livemode: boolean
  default_payment_method?: string | null
}

export interface ListSubscriptionsParams {
  limit?: number
  customer?: string
  status?: SubscriptionStatus | 'all'
  price?: string
  starting_after?: string
}

export interface ListSubscriptionsResponse {
  count: number
  subscriptions: StripeSubscription[]
  hasMore: boolean
}

export interface GetSubscriptionParams {
  id: string
}

export interface GetSubscriptionResponse {
  subscription: StripeSubscription
}

export interface CreateSubscriptionParams {
  customer: string
  items: Array<{
    price: string
    quantity?: number
  }>
  metadata?: Metadata
  trial_period_days?: number
  default_payment_method?: string
  cancel_at_period_end?: boolean
}

export interface CreateSubscriptionResponse {
  success: boolean
  subscription: StripeSubscription
}

export interface UpdateSubscriptionParams {
  id: string
  items?: Array<{
    id?: string
    price?: string
    quantity?: number
    deleted?: boolean
  }>
  metadata?: Metadata
  cancel_at_period_end?: boolean
  default_payment_method?: string
  proration_behavior?: 'create_prorations' | 'none' | 'always_invoice'
}

export interface UpdateSubscriptionResponse {
  success: boolean
  subscription: StripeSubscription
}

export interface CancelSubscriptionParams {
  id: string
  invoice_now?: boolean
  prorate?: boolean
}

export interface CancelSubscriptionResponse {
  success: boolean
  subscription: StripeSubscription
}

// ============================================================================
// Invoice
// ============================================================================

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

export interface StripeInvoice {
  id: string
  object: 'invoice'
  customer: string
  status: InvoiceStatus
  amount_due: number
  amount_paid: number
  amount_remaining: number
  currency: string
  subscription?: string | null
  lines: {
    data: Array<{
      id: string
      amount: number
      description?: string | null
      quantity?: number | null
      price?: StripePrice | null
    }>
  }
  created: number
  due_date?: number | null
  paid: boolean
  hosted_invoice_url?: string | null
  invoice_pdf?: string | null
  metadata: Metadata
  livemode: boolean
  number?: string | null
}

export interface ListInvoicesParams {
  limit?: number
  customer?: string
  subscription?: string
  status?: InvoiceStatus
  starting_after?: string
  created?: { gt?: number; gte?: number; lt?: number; lte?: number }
}

export interface ListInvoicesResponse {
  count: number
  invoices: StripeInvoice[]
  hasMore: boolean
}

export interface GetInvoiceParams {
  id: string
}

export interface GetInvoiceResponse {
  invoice: StripeInvoice
}

export interface CreateInvoiceParams {
  customer: string
  subscription?: string
  metadata?: Metadata
  description?: string
  auto_advance?: boolean
  collection_method?: 'charge_automatically' | 'send_invoice'
  days_until_due?: number
}

export interface CreateInvoiceResponse {
  success: boolean
  invoice: StripeInvoice
}

export interface FinalizeInvoiceParams {
  id: string
  auto_advance?: boolean
}

export interface FinalizeInvoiceResponse {
  success: boolean
  invoice: StripeInvoice
}

export interface PayInvoiceParams {
  id: string
  payment_method?: string
}

export interface PayInvoiceResponse {
  success: boolean
  invoice: StripeInvoice
}

export interface VoidInvoiceParams {
  id: string
}

export interface VoidInvoiceResponse {
  success: boolean
  invoice: StripeInvoice
}

// ============================================================================
// Refund
// ============================================================================

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled'

export interface StripeRefund {
  id: string
  object: 'refund'
  amount: number
  currency: string
  payment_intent?: string | null
  charge?: string | null
  status: RefundStatus
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | null
  metadata: Metadata
  created: number
}

export interface ListRefundsParams {
  limit?: number
  payment_intent?: string
  charge?: string
  starting_after?: string
}

export interface ListRefundsResponse {
  count: number
  refunds: StripeRefund[]
  hasMore: boolean
}

export interface CreateRefundParams {
  payment_intent?: string
  charge?: string
  amount?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: Metadata
}

export interface CreateRefundResponse {
  success: boolean
  refund: StripeRefund
}

// ============================================================================
// Balance
// ============================================================================

export interface StripeBalance {
  object: 'balance'
  available: Array<{
    amount: number
    currency: string
    source_types?: { card?: number; bank_account?: number }
  }>
  pending: Array<{
    amount: number
    currency: string
    source_types?: { card?: number; bank_account?: number }
  }>
  livemode: boolean
}

export interface GetBalanceResponse {
  balance: StripeBalance
}

// ============================================================================
// Balance Transaction
// ============================================================================

export interface StripeBalanceTransaction {
  id: string
  object: 'balance_transaction'
  amount: number
  currency: string
  fee: number
  net: number
  type: string
  status: 'available' | 'pending'
  created: number
  description?: string | null
  source?: string | null
}

export interface ListBalanceTransactionsParams {
  limit?: number
  type?: string
  starting_after?: string
  created?: { gt?: number; gte?: number; lt?: number; lte?: number }
}

export interface ListBalanceTransactionsResponse {
  count: number
  transactions: StripeBalanceTransaction[]
  hasMore: boolean
}

// ============================================================================
// Charge
// ============================================================================

export interface StripeCharge {
  id: string
  object: 'charge'
  amount: number
  amount_captured: number
  amount_refunded: number
  currency: string
  customer?: string | null
  description?: string | null
  payment_intent?: string | null
  status: 'succeeded' | 'pending' | 'failed'
  paid: boolean
  refunded: boolean
  receipt_url?: string | null
  metadata: Metadata
  created: number
  livemode: boolean
}

export interface ListChargesParams {
  limit?: number
  customer?: string
  payment_intent?: string
  starting_after?: string
  created?: { gt?: number; gte?: number; lt?: number; lte?: number }
}

export interface ListChargesResponse {
  count: number
  charges: StripeCharge[]
  hasMore: boolean
}

export interface GetChargeParams {
  id: string
}

export interface GetChargeResponse {
  charge: StripeCharge
}

// ============================================================================
// Webhook Endpoint
// ============================================================================

export interface StripeWebhookEndpoint {
  id: string
  object: 'webhook_endpoint'
  url: string
  enabled_events: string[]
  status: 'enabled' | 'disabled'
  api_version?: string | null
  description?: string | null
  metadata: Metadata
  created: number
  livemode: boolean
}

export interface ListWebhookEndpointsParams {
  limit?: number
  starting_after?: string
}

export interface ListWebhookEndpointsResponse {
  count: number
  webhooks: StripeWebhookEndpoint[]
  hasMore: boolean
}
