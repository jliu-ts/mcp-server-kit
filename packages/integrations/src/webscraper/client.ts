// @ts-nocheck
/**
 * WebScraper Client
 *
 * Runtime-agnostic client for web scraping and content extraction.
 * Works in Node.js, Edge runtimes, and Cloudflare Workers.
 *
 * @example
 * import { WebScraperClient } from '@trendingsociety/integrations/webscraper'
 *
 * const scraper = new WebScraperClient()
 *
 * // Fetch and parse a page
 * const result = await scraper.fetchPage({ url: 'https://example.com' })
 *
 * // Extract just the text
 * const text = await scraper.extractText({ url: 'https://example.com' })
 */

import { ok, fail, type Result, type ClientConfig } from '../types.js'
import type {
  FetchPageParams,
  PageContent,
  PageLink,
  PageImage,
  ExtractTextParams,
  ExtractedText,
  ExtractLinksParams,
  ExtractMetadataParams,
  PageMetadata,
  BatchFetchParams,
  BatchFetchResult,
} from './types.js'

// ============================================================================
// Configuration
// ============================================================================

export interface WebScraperClientConfig extends ClientConfig {
  /** Default timeout for requests (ms) */
  timeout?: number
  /** User agent string */
  userAgent?: string
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; TrendingSociety/1.0; +https://trendingsociety.com/bot)'

// ============================================================================
// Client Implementation
// ============================================================================

export class WebScraperClient {
  private timeout: number
  private userAgent: string
  private fetchFn: typeof fetch
  private debug: boolean

  constructor(config: WebScraperClientConfig = {}) {
    this.timeout = config.timeout ?? 30000
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT
    this.fetchFn = config.fetch ?? fetch.bind(globalThis)
    this.debug = config.debug ?? false
  }

  // --------------------------------------------------------------------------
  // Fetch & Parse
  // --------------------------------------------------------------------------

  /**
   * Fetch a page and extract structured content
   */
  async fetchPage(params: FetchPageParams): Promise<Result<PageContent>> {
    const { url, headers = {}, timeout = this.timeout } = params

    if (!url || !this.isValidUrl(url)) {
      return fail('INVALID_PARAMS', 'Valid URL is required')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...headers,
        },
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return fail('HTTP_ERROR', `HTTP ${response.status}: ${response.statusText}`, response.status)
      }

      const html = await response.text()
      const finalUrl = response.url

      const content = this.parseHtml(html, finalUrl)
      content.url = url
      content.finalUrl = finalUrl
      content.statusCode = response.status

      if (this.debug) {
        console.log('[WebScraperClient] Fetched:', url, '-> title:', content.title)
      }

      return ok(content)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return fail('TIMEOUT', `Request timed out after ${timeout}ms`)
        }
        return fail('NETWORK_ERROR', error.message)
      }

      return fail('UNKNOWN_ERROR', String(error))
    }
  }

  /**
   * Extract just the text content from a URL
   */
  async extractText(params: ExtractTextParams): Promise<Result<ExtractedText>> {
    const result = await this.fetchPage({ url: params.url })
    if (!result.success) return result

    let text = result.data.textContent
    if (params.maxLength && text.length > params.maxLength) {
      text = text.substring(0, params.maxLength) + '...'
    }

    const extracted: ExtractedText = {
      url: params.url,
      title: result.data.title,
      text,
      wordCount: result.data.wordCount,
    }

    if (params.includeLinks) {
      extracted.links = result.data.links
    }

    return ok(extracted)
  }

  /**
   * Extract all links from a page
   */
  async extractLinks(params: ExtractLinksParams): Promise<Result<PageLink[]>> {
    const result = await this.fetchPage({ url: params.url })
    if (!result.success) return result

    let links = result.data.links

    if (params.externalOnly) {
      links = links.filter((link) => link.isExternal)
    }

    if (params.pattern) {
      try {
        const regex = new RegExp(params.pattern, 'i')
        links = links.filter((link) => regex.test(link.href))
      } catch {
        return fail('INVALID_PARAMS', 'Invalid regex pattern')
      }
    }

    return ok(links)
  }

  /**
   * Extract metadata from a page
   */
  async extractMetadata(params: ExtractMetadataParams): Promise<Result<PageMetadata>> {
    const result = await this.fetchPage({ url: params.url })
    if (!result.success) return result

    const { html } = result.data
    if (!html) {
      return fail('PARSE_ERROR', 'HTML content not available')
    }

    const metadata = this.parseMetadata(html, result.data.finalUrl)
    metadata.url = params.url
    metadata.title = result.data.title
    metadata.description = result.data.description
    metadata.og = result.data.og

    return ok(metadata)
  }

  /**
   * Fetch multiple URLs in parallel
   */
  async batchFetch(params: BatchFetchParams): Promise<Result<BatchFetchResult>> {
    const { urls, concurrency = 5 } = params

    if (!urls || urls.length === 0) {
      return fail('INVALID_PARAMS', 'At least one URL is required')
    }

    const results: BatchFetchResult = {
      successful: [],
      failed: [],
    }

    // Process in batches based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency)
      const promises = batch.map(async (url) => {
        const result = await this.fetchPage({ url })
        if (result.success) {
          results.successful.push(result.data)
        } else {
          results.failed.push({ url, error: result.error.message })
        }
      })
      await Promise.all(promises)
    }

    return ok(results)
  }

  // --------------------------------------------------------------------------
  // HTML Parsing (regex-based for edge runtime compatibility)
  // --------------------------------------------------------------------------

  private parseHtml(html: string, baseUrl: string): PageContent {
    const content: PageContent = {
      url: '',
      finalUrl: baseUrl,
      statusCode: 200,
      title: this.extractTag(html, 'title'),
      description: this.extractMeta(html, 'description'),
      og: {
        title: this.extractMeta(html, 'og:title'),
        description: this.extractMeta(html, 'og:description'),
        image: this.extractMeta(html, 'og:image'),
        type: this.extractMeta(html, 'og:type'),
        siteName: this.extractMeta(html, 'og:site_name'),
      },
      textContent: '',
      wordCount: 0,
      links: [],
      images: [],
      html,
    }

    // Extract text content
    content.textContent = this.extractTextContent(html)
    content.wordCount = content.textContent.split(/\s+/).filter(Boolean).length

    // Extract links
    content.links = this.extractAllLinks(html, baseUrl)

    // Extract images
    content.images = this.extractAllImages(html, baseUrl)

    return content
  }

  private parseMetadata(html: string, baseUrl: string): PageMetadata {
    return {
      url: baseUrl,
      title: this.extractTag(html, 'title'),
      description: this.extractMeta(html, 'description'),
      keywords: (this.extractMeta(html, 'keywords') || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      author: this.extractMeta(html, 'author'),
      publishedDate:
        this.extractMeta(html, 'article:published_time') ||
        this.extractMeta(html, 'datePublished'),
      modifiedDate:
        this.extractMeta(html, 'article:modified_time') || this.extractMeta(html, 'dateModified'),
      canonical: this.extractCanonical(html),
      og: {
        title: this.extractMeta(html, 'og:title'),
        description: this.extractMeta(html, 'og:description'),
        image: this.extractMeta(html, 'og:image'),
        type: this.extractMeta(html, 'og:type'),
        siteName: this.extractMeta(html, 'og:site_name'),
      },
      twitter: {
        card: this.extractMeta(html, 'twitter:card'),
        site: this.extractMeta(html, 'twitter:site'),
        creator: this.extractMeta(html, 'twitter:creator'),
        title: this.extractMeta(html, 'twitter:title'),
        description: this.extractMeta(html, 'twitter:description'),
        image: this.extractMeta(html, 'twitter:image'),
      },
      favicon: this.extractFavicon(html, baseUrl),
      language: this.extractLanguage(html),
    }
  }

  private extractTag(html: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i')
    const match = html.match(regex)
    return match ? this.decodeHtml(match[1]!.trim()) : null
  }

  private extractMeta(html: string, name: string): string | null {
    // Try name attribute
    let regex = new RegExp(
      `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
      'i'
    )
    let match = html.match(regex)
    if (match) return this.decodeHtml(match[1]!)

    // Try content before name (alternate order)
    regex = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
      'i'
    )
    match = html.match(regex)
    return match ? this.decodeHtml(match[1]!) : null
  }

  private extractCanonical(html: string): string | null {
    const regex = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i
    const match = html.match(regex)
    return match ? match[1]! : null
  }

  private extractFavicon(html: string, baseUrl: string): string | null {
    const regex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i
    const match = html.match(regex)
    if (match) {
      return this.resolveUrl(match[1]!, baseUrl)
    }
    // Default favicon location
    try {
      const url = new URL(baseUrl)
      return `${url.protocol}//${url.host}/favicon.ico`
    } catch {
      return null
    }
  }

  private extractLanguage(html: string): string | null {
    const regex = /<html[^>]*lang=["']([^"']*)["']/i
    const match = html.match(regex)
    return match ? match[1]! : null
  }

  private extractTextContent(html: string): string {
    // Remove script, style, and other non-content tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = this.decodeHtml(text)

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim()

    return text
  }

  private extractAllLinks(html: string, baseUrl: string): PageLink[] {
    const links: PageLink[] = []
    const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match

    while ((match = regex.exec(html)) !== null) {
      const href = match[1]!
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        continue
      }

      const resolvedUrl = this.resolveUrl(href, baseUrl)
      const text = match[2]!.replace(/<[^>]+>/g, '').trim()
      const isExternal = this.isExternalUrl(resolvedUrl, baseUrl)

      links.push({ href: resolvedUrl, text, isExternal })
    }

    return links
  }

  private extractAllImages(html: string, baseUrl: string): PageImage[] {
    const images: PageImage[] = []
    const regex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi
    let match

    while ((match = regex.exec(html)) !== null) {
      const src = this.resolveUrl(match[1]!, baseUrl)
      const altMatch = match[0]!.match(/alt=["']([^"']*)["']/i)
      const widthMatch = match[0]!.match(/width=["']?(\d+)/i)
      const heightMatch = match[0]!.match(/height=["']?(\d+)/i)

      images.push({
        src,
        alt: altMatch ? altMatch[1]! : null,
        width: widthMatch ? parseInt(widthMatch[1]!) : undefined,
        height: heightMatch ? parseInt(heightMatch[1]!) : undefined,
      })
    }

    return images
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).href
    } catch {
      return href
    }
  }

  private isExternalUrl(url: string, baseUrl: string): boolean {
    try {
      const urlHost = new URL(url).host
      const baseHost = new URL(baseUrl).host
      return urlHost !== baseHost
    } catch {
      return true
    }
  }

  private decodeHtml(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
  }
}
