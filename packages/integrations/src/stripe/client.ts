/**
 * Stripe API Client
 *
 * Runtime-agnostic client for Stripe's REST API.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { StripeClient } from '@trendingsociety/integrations/stripe'
 *
 * const stripe = new StripeClient({
 *   secretKey: process.env.STRIPE_SECRET_KEY,
 * })
 *
 * const customers = await stripe.listCustomers({ limit: 10 })
 * const subscription = await stripe.createSubscription({
 *   customer: 'cus_xxx',
 *   items: [{ price: 'price_xxx' }],
 * })
 */

import { API } from '../config/constants'
import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
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
  StripeRefund,
  ListRefundsParams,
  ListRefundsResponse,
  CreateRefundParams,
  CreateRefundResponse,
  // Balance
  StripeBalance,
  GetBalanceResponse,
  ListBalanceTransactionsParams,
  ListBalanceTransactionsResponse,
  // Charges
  ListChargesParams,
  ListChargesResponse,
  GetChargeParams,
  GetChargeResponse,
  // Webhooks
  ListWebhookEndpointsParams,
  ListWebhookEndpointsResponse,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const STRIPE_API_VERSION = '2024-11-20.acacia'

export interface StripeClientConfig extends ClientConfig {
  /** Stripe secret key (sk_live_xxx or sk_test_xxx) */
  secretKey: string
  /** API version override (default: 2024-11-20.acacia) */
  apiVersion?: string
}

// ============================================================================
// Client Implementation
// ============================================================================

export class StripeClient {
  private secretKey: string
  private apiVersion: string
  private timeout: number
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: StripeClientConfig) {
    if (!config.secretKey) {
      throw new Error('StripeClient requires secretKey')
    }

    this.secretKey = config.secretKey
    this.apiVersion = config.apiVersion ?? STRIPE_API_VERSION
    this.timeout = config.timeout ?? API.defaultTimeout
    this.fetchFn = config.fetch ?? fetch
    this.debug = config.debug ?? false
  }

  // ==========================================================================
  // Customers
  // ==========================================================================

  async listCustomers(params: ListCustomersParams = {}): Promise<Result<ListCustomersResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      email: params.email,
      starting_after: params.starting_after,
      ending_before: params.ending_before,
    })

    const result = await this.request<{ data: StripeCustomer[]; has_more: boolean }>(
      `customers?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      customers: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getCustomer(params: GetCustomerParams): Promise<Result<GetCustomerResponse>> {
    const result = await this.request<StripeCustomer>(`customers/${params.id}`)
    if (!result.success) return result
    return ok({ customer: result.data })
  }

  async createCustomer(params: CreateCustomerParams): Promise<Result<CreateCustomerResponse>> {
    const result = await this.request<StripeCustomer>('customers', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, customer: result.data })
  }

  async updateCustomer(params: UpdateCustomerParams): Promise<Result<UpdateCustomerResponse>> {
    const { id, ...updateParams } = params
    const result = await this.request<StripeCustomer>(`customers/${id}`, 'POST', updateParams)
    if (!result.success) return result
    return ok({ success: true, customer: result.data })
  }

  // ==========================================================================
  // Products
  // ==========================================================================

  async listProducts(params: ListProductsParams = {}): Promise<Result<ListProductsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      active: params.active,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripeProduct[]; has_more: boolean }>(
      `products?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      products: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getProduct(params: GetProductParams): Promise<Result<GetProductResponse>> {
    const result = await this.request<StripeProduct>(`products/${params.id}`)
    if (!result.success) return result
    return ok({ product: result.data })
  }

  async createProduct(params: CreateProductParams): Promise<Result<CreateProductResponse>> {
    const result = await this.request<StripeProduct>('products', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, product: result.data })
  }

  async updateProduct(params: UpdateProductParams): Promise<Result<UpdateProductResponse>> {
    const { id, ...updateParams } = params
    const result = await this.request<StripeProduct>(`products/${id}`, 'POST', updateParams)
    if (!result.success) return result
    return ok({ success: true, product: result.data })
  }

  // ==========================================================================
  // Prices
  // ==========================================================================

  async listPrices(params: ListPricesParams = {}): Promise<Result<ListPricesResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      product: params.product,
      active: params.active,
      type: params.type,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripePrice[]; has_more: boolean }>(
      `prices?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      prices: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getPrice(params: GetPriceParams): Promise<Result<GetPriceResponse>> {
    const result = await this.request<StripePrice>(`prices/${params.id}`)
    if (!result.success) return result
    return ok({ price: result.data })
  }

  async createPrice(params: CreatePriceParams): Promise<Result<CreatePriceResponse>> {
    const result = await this.request<StripePrice>('prices', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, price: result.data })
  }

  // ==========================================================================
  // Payment Intents
  // ==========================================================================

  async listPaymentIntents(
    params: ListPaymentIntentsParams = {}
  ): Promise<Result<ListPaymentIntentsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      customer: params.customer,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripePaymentIntent[]; has_more: boolean }>(
      `payment_intents?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      paymentIntents: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getPaymentIntent(params: GetPaymentIntentParams): Promise<Result<GetPaymentIntentResponse>> {
    const result = await this.request<StripePaymentIntent>(`payment_intents/${params.id}`)
    if (!result.success) return result
    return ok({ paymentIntent: result.data })
  }

  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<Result<CreatePaymentIntentResponse>> {
    const result = await this.request<StripePaymentIntent>('payment_intents', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, paymentIntent: result.data })
  }

  async capturePaymentIntent(
    params: CapturePaymentIntentParams
  ): Promise<Result<CapturePaymentIntentResponse>> {
    const { id, ...captureParams } = params
    const result = await this.request<StripePaymentIntent>(
      `payment_intents/${id}/capture`,
      'POST',
      captureParams
    )
    if (!result.success) return result
    return ok({ success: true, paymentIntent: result.data })
  }

  async cancelPaymentIntent(
    params: CancelPaymentIntentParams
  ): Promise<Result<CancelPaymentIntentResponse>> {
    const { id, ...cancelParams } = params
    const result = await this.request<StripePaymentIntent>(
      `payment_intents/${id}/cancel`,
      'POST',
      cancelParams
    )
    if (!result.success) return result
    return ok({ success: true, paymentIntent: result.data })
  }

  // ==========================================================================
  // Subscriptions
  // ==========================================================================

  async listSubscriptions(
    params: ListSubscriptionsParams = {}
  ): Promise<Result<ListSubscriptionsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      customer: params.customer,
      status: params.status,
      price: params.price,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripeSubscription[]; has_more: boolean }>(
      `subscriptions?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      subscriptions: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getSubscription(params: GetSubscriptionParams): Promise<Result<GetSubscriptionResponse>> {
    const result = await this.request<StripeSubscription>(`subscriptions/${params.id}`)
    if (!result.success) return result
    return ok({ subscription: result.data })
  }

  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<Result<CreateSubscriptionResponse>> {
    const result = await this.request<StripeSubscription>('subscriptions', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, subscription: result.data })
  }

  async updateSubscription(
    params: UpdateSubscriptionParams
  ): Promise<Result<UpdateSubscriptionResponse>> {
    const { id, ...updateParams } = params
    const result = await this.request<StripeSubscription>(`subscriptions/${id}`, 'POST', updateParams)
    if (!result.success) return result
    return ok({ success: true, subscription: result.data })
  }

  async cancelSubscription(
    params: CancelSubscriptionParams
  ): Promise<Result<CancelSubscriptionResponse>> {
    const { id, ...cancelParams } = params
    const result = await this.request<StripeSubscription>(`subscriptions/${id}`, 'DELETE', cancelParams)
    if (!result.success) return result
    return ok({ success: true, subscription: result.data })
  }

  // ==========================================================================
  // Invoices
  // ==========================================================================

  async listInvoices(params: ListInvoicesParams = {}): Promise<Result<ListInvoicesResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      customer: params.customer,
      subscription: params.subscription,
      status: params.status,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripeInvoice[]; has_more: boolean }>(
      `invoices?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      invoices: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getInvoice(params: GetInvoiceParams): Promise<Result<GetInvoiceResponse>> {
    const result = await this.request<StripeInvoice>(`invoices/${params.id}`)
    if (!result.success) return result
    return ok({ invoice: result.data })
  }

  async createInvoice(params: CreateInvoiceParams): Promise<Result<CreateInvoiceResponse>> {
    const result = await this.request<StripeInvoice>('invoices', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, invoice: result.data })
  }

  async finalizeInvoice(params: FinalizeInvoiceParams): Promise<Result<FinalizeInvoiceResponse>> {
    const { id, ...finalizeParams } = params
    const result = await this.request<StripeInvoice>(
      `invoices/${id}/finalize`,
      'POST',
      finalizeParams
    )
    if (!result.success) return result
    return ok({ success: true, invoice: result.data })
  }

  async payInvoice(params: PayInvoiceParams): Promise<Result<PayInvoiceResponse>> {
    const { id, ...payParams } = params
    const result = await this.request<StripeInvoice>(`invoices/${id}/pay`, 'POST', payParams)
    if (!result.success) return result
    return ok({ success: true, invoice: result.data })
  }

  async voidInvoice(params: VoidInvoiceParams): Promise<Result<VoidInvoiceResponse>> {
    const result = await this.request<StripeInvoice>(`invoices/${params.id}/void`, 'POST')
    if (!result.success) return result
    return ok({ success: true, invoice: result.data })
  }

  // ==========================================================================
  // Refunds
  // ==========================================================================

  async listRefunds(params: ListRefundsParams = {}): Promise<Result<ListRefundsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      payment_intent: params.payment_intent,
      charge: params.charge,
      starting_after: params.starting_after,
    })

    const result = await this.request<{ data: StripeRefund[]; has_more: boolean }>(
      `refunds?${queryParams}`
    )

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      refunds: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async createRefund(params: CreateRefundParams): Promise<Result<CreateRefundResponse>> {
    const result = await this.request<StripeRefund>('refunds', 'POST', params as unknown as Record<string, unknown>)
    if (!result.success) return result
    return ok({ success: true, refund: result.data })
  }

  // ==========================================================================
  // Balance
  // ==========================================================================

  async getBalance(): Promise<Result<GetBalanceResponse>> {
    const result = await this.request<StripeBalance>('balance')
    if (!result.success) return result
    return ok({ balance: result.data })
  }

  async listBalanceTransactions(
    params: ListBalanceTransactionsParams = {}
  ): Promise<Result<ListBalanceTransactionsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      type: params.type,
      starting_after: params.starting_after,
    })

    const result = await this.request<{
      data: Array<{
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
      }>
      has_more: boolean
    }>(`balance_transactions?${queryParams}`)

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      transactions: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  // ==========================================================================
  // Charges
  // ==========================================================================

  async listCharges(params: ListChargesParams = {}): Promise<Result<ListChargesResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      customer: params.customer,
      payment_intent: params.payment_intent,
      starting_after: params.starting_after,
    })

    const result = await this.request<{
      data: Array<{
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
        metadata: Record<string, string>
        created: number
        livemode: boolean
      }>
      has_more: boolean
    }>(`charges?${queryParams}`)

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      charges: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  async getCharge(params: GetChargeParams): Promise<Result<GetChargeResponse>> {
    const result = await this.request<{
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
      metadata: Record<string, string>
      created: number
      livemode: boolean
    }>(`charges/${params.id}`)

    if (!result.success) return result
    return ok({ charge: result.data })
  }

  // ==========================================================================
  // Webhook Endpoints
  // ==========================================================================

  async listWebhookEndpoints(
    params: ListWebhookEndpointsParams = {}
  ): Promise<Result<ListWebhookEndpointsResponse>> {
    const queryParams = this.buildQueryParams({
      limit: params.limit ?? 10,
      starting_after: params.starting_after,
    })

    const result = await this.request<{
      data: Array<{
        id: string
        object: 'webhook_endpoint'
        url: string
        enabled_events: string[]
        status: 'enabled' | 'disabled'
        api_version?: string | null
        description?: string | null
        metadata: Record<string, string>
        created: number
        livemode: boolean
      }>
      has_more: boolean
    }>(`webhook_endpoints?${queryParams}`)

    if (!result.success) return result

    return ok({
      count: result.data.data.length,
      webhooks: result.data.data,
      hasMore: result.data.has_more,
    })
  }

  // ==========================================================================
  // HTTP Helper
  // ==========================================================================

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<Result<T>> {
    const url = `${STRIPE_API_BASE}/${path}`

    if (this.debug) {
      console.log(`[StripeClient] ${method} ${path}`)
      if (body) console.log('[StripeClient] Body:', JSON.stringify(body, null, 2))
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.secretKey}`,
        'Stripe-Version': this.apiVersion,
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      const options: RequestInit = {
        method,
        headers,
      }

      if (body && (method === 'POST' || method === 'DELETE')) {
        options.body = this.encodeFormData(body)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await this.fetchFn(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error?.message || `HTTP ${response.status}`
        return fail(
          data.error?.code || 'STRIPE_ERROR',
          errorMessage,
          response.status,
          data.error
        )
      }

      return ok(data as T)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return fail('TIMEOUT', `Request timed out after ${this.timeout}ms`)
      }
      return fail('NETWORK_ERROR', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private buildQueryParams(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    }
    return searchParams.toString()
  }

  private encodeFormData(data: Record<string, unknown>, prefix = ''): string {
    const parts: string[] = []

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue

      const fullKey = prefix ? `${prefix}[${key}]` : key

      if (typeof value === 'object' && !Array.isArray(value)) {
        parts.push(this.encodeFormData(value as Record<string, unknown>, fullKey))
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            parts.push(this.encodeFormData(item as Record<string, unknown>, `${fullKey}[${index}]`))
          } else {
            parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`)
          }
        })
      } else {
        parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
      }
    }

    return parts.filter(Boolean).join('&')
  }
}
