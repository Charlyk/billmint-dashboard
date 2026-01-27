/**
 * Currency and date formatting utilities for PDF generation
 * Provides locale-aware formatting for international invoices
 */

// Re-export currencyLocales from the centralized currency utility
export { currencyLocales } from './currency'

/**
 * Format a monetary amount for PDF display
 * Uses currency code instead of symbol (e.g., "1,250.00 USD")
 * Uses the provided locale for decimal/thousands separators
 */
export function formatCurrencyForPdf(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} ${currency}`
}

/**
 * Format a date for PDF display
 * Supports various date format patterns
 */
export function formatDateForPdf(
  date: string | Date,
  locale?: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const effectiveLocale = locale || 'en-US'

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }

  return new Intl.DateTimeFormat(effectiveLocale, formatOptions[format]).format(dateObj)
}

/**
 * Format a quantity for display (handles hours and units)
 */
export function formatQuantityForPdf(quantity: number, isHours: boolean = false): string {
  if (isHours) {
    return `${quantity.toFixed(2)}h`
  }
  // For whole numbers, don't show decimals
  if (Number.isInteger(quantity)) {
    return quantity.toString()
  }
  return quantity.toFixed(2)
}
