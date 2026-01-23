import { NextRequest } from 'next/server'
import { autopauseStaleTimers } from '@/lib/services/cron.service'

// Vercel cron jobs send a special header to authenticate
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await autopauseStaleTimers()

    console.log('[Cron] Auto-pause timers result:', result)

    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Auto-pause timers error:', error)

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
