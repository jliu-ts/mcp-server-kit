/**
 * WebScraper Types
 *
 * Types for web scraping and content extraction operations.
 */

// ============================================================================
// Fetch & Parse Types
// ============================================================================

export interface FetchPageParams {
  /** URL to fetch */
  url: string
  /** Custom headers to send with request */
  headers?: Record<string, string>
  /** Timeout in milliseconds */
  timeout?: number
}

export interface PageContent {
  /** Original URL */
  url: string
  /** Final URL after redirects */
  finalUrl: string
  /** HTTP status code */
  statusCode: number
  /** Page title from <title> tag */
  title: string | null
  /** Meta description */
  description: string | null
  /** Open Graph metadata */
  og: {
    title: string | null
    description: string | null
    image: string | null
    type: string | null
    siteName: string | null
  }
  /** Main text content (cleaned) */
  textContent: string
  /** Word count of text content */
  wordCount: number
  /** All links found on the page */
  links: PageLink[]
  /** All images found on the page */
  images: PageImage[]
  /** Raw HTML (optional) */
  html?: string
}

export interface PageLink {
  /** Link URL (resolved to absolute) */
  href: string
  /** Link text */
  text: string
  /** Whether link is external */
  isExternal: boolean
}

export interface PageImage {
  /** Image URL (resolved to absolute) */
  src: string
  /** Alt text */
  alt: string | null
  /** Width if specified */
  width?: number
  /** Height if specified */
  height?: number
}

// ============================================================================
// Extract Types
// ============================================================================

export interface ExtractTextParams {
  /** URL to extract text from */
  url: string
  /** Include links in output */
  includeLinks?: boolean
  /** Maximum characters to return */
  maxLength?: number
}

export interface ExtractedText {
  url: string
  title: string | null
  text: string
  wordCount: number
  links?: PageLink[]
}

export interface ExtractLinksParams {
  /** URL to extract links from */
  url: string
  /** Only return external links */
  externalOnly?: boolean
  /** Filter links by pattern (regex) */
  pattern?: string
}

export interface ExtractMetadataParams {
  /** URL to extract metadata from */
  url: string
}

export interface PageMetadata {
  url: string
  title: string | null
  description: string | null
  keywords: string[]
  author: string | null
  publishedDate: string | null
  modifiedDate: string | null
  canonical: string | null
  og: PageContent['og']
  twitter: {
    card: string | null
    site: string | null
    creator: string | null
    title: string | null
    description: string | null
    image: string | null
  }
  favicon: string | null
  language: string | null
}

// ============================================================================
// Batch Types
// ============================================================================

export interface BatchFetchParams {
  /** URLs to fetch */
  urls: string[]
  /** Concurrency limit */
  concurrency?: number
}

export interface BatchFetchResult {
  successful: PageContent[]
  failed: Array<{
    url: string
    error: string
  }>
}
