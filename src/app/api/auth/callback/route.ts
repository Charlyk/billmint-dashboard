import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Mark OAuth users as email verified (their email is already verified by the OAuth provider)
      const adminClient = createAdminClient()
      await adminClient
        .from('users')
        .update({ email_verified_at: new Date().toISOString() } as never)
        .eq('id', data.user.id)
        .is('email_verified_at', null)

      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    }
  }

  // Return to login page with error
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', requestUrl.origin)
  )
}

export const GET = withLogging(handleGet)
