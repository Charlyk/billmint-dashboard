export type Currency = string

// Currency to locale mapping for number formatting
export const currencyLocales: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CHF: 'de-CH',
  JPY: 'ja-JP',
  INR: 'en-IN',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  PLN: 'pl-PL',
  RON: 'ro-RO',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  NZD: 'en-NZ',
  SGD: 'en-SG',
  HKD: 'zh-HK',
  ZAR: 'en-ZA',
  AED: 'ar-AE',
}

// Get locale for a currency
export function getLocaleForCurrency(currency: string): string {
  return currencyLocales[currency] || 'en-US'
}

/**
 * Format amount as currency string with currency code
 * Uses userCurrency to determine locale for decimal/thousands separators
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  userCurrency?: string
): string {
  const locale = getLocaleForCurrency(userCurrency || currency)
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} ${currency}`
}

/**
 * Calculate amount from hours and rate
 */
export function calculateAmount(
  durationSeconds: number,
  hourlyRate: number
): number {
  const hours = durationSeconds / 3600
  return Math.round(hours * hourlyRate * 100) / 100
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(
  lineItems: Array<{ quantity: number; unit_price: number }>
): number {
  return lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100
}

/**
 * Calculate total with tax and discount
 */
export function calculateTotal(
  subtotal: number,
  taxRate: number = 0,
  discountAmount: number = 0
): number {
  const tax = calculateTax(subtotal, taxRate)
  return Math.round((subtotal + tax - discountAmount) * 100) / 100
}

/**
 * Parse currency string to number
 */
export function parseCurrencyString(value: string): number {
  // Remove currency symbols and thousands separators
  const cleaned = value.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Get list of supported currencies with labels
 */
export function getCurrencies(): Array<{ value: string; label: string }> {
  return [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
    { value: 'CHF', label: 'CHF' },
    { value: 'JPY', label: 'JPY' },
    { value: 'INR', label: 'INR' },
    { value: 'BRL', label: 'BRL' },
    { value: 'MXN', label: 'MXN' },
    { value: 'PLN', label: 'PLN' },
    { value: 'RON', label: 'RON' },
    { value: 'SEK', label: 'SEK' },
    { value: 'NOK', label: 'NOK' },
    { value: 'DKK', label: 'DKK' },
    { value: 'NZD', label: 'NZD' },
    { value: 'SGD', label: 'SGD' },
    { value: 'HKD', label: 'HKD' },
    { value: 'ZAR', label: 'ZAR' },
    { value: 'AED', label: 'AED' },
  ]
}
