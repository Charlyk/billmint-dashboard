import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { requestContext, generateCorrelationId } from '@/lib/logging/correlation'
import { logger } from '@/lib/logging/logger'

export async function middleware(request: NextRequest) {
  // Generate or reuse correlation ID from incoming request
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId()

  // Wrap middleware execution in AsyncLocalStorage context
  return await requestContext.run({ correlationId }, async () => {
    // Call Supabase session update
    const supabaseResponse = await updateSession(request)

    // Set correlation ID on response header
    supabaseResponse.headers.set('x-correlation-id', correlationId)

    // Log the incoming request
    logger.info('Request received', {
      service: 'middleware',
      correlationId,
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return supabaseResponse
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - API routes that should be publicly accessible (webhooks)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/billing/webhook|api/invoices/public).*)',
  ],
}
