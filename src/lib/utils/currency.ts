export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'

const currencyConfig: Record<
  Currency,
  { symbol: string; locale: string; position: 'before' | 'after' }
> = {
  USD: { symbol: '$', locale: 'en-US', position: 'before' },
  EUR: { symbol: '\u20AC', locale: 'de-DE', position: 'after' },
  GBP: { symbol: '\u00A3', locale: 'en-GB', position: 'before' },
  CAD: { symbol: 'C$', locale: 'en-CA', position: 'before' },
  AUD: { symbol: 'A$', locale: 'en-AU', position: 'before' },
}

/**
 * Format amount as currency string
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD'
): string {
  const config = currencyConfig[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount with just the symbol (no locale formatting)
 */
export function formatAmountWithSymbol(
  amount: number,
  currency: Currency = 'USD'
): string {
  const config = currencyConfig[currency]
  const formatted = amount.toFixed(2)
  return config.position === 'before'
    ? `${config.symbol}${formatted}`
    : `${formatted}${config.symbol}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'USD'): string {
  return currencyConfig[currency].symbol
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
export function getCurrencies(): Array<{ value: Currency; label: string }> {
  return [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (\u20AC)' },
    { value: 'GBP', label: 'GBP (\u00A3)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
  ]
}
