import { NextRequest } from 'next/server'
import { autopauseStaleTimers } from '@/lib/services/cron.service'
import { createServiceLogger } from '@/lib/logging/logger'
import { sanitizeError } from '@/lib/logging/sanitizers'
import { withLogging } from '@/lib/logging/route-handler'

const log = createServiceLogger('cron')

// Vercel cron jobs send a special header to authenticate
const CRON_SECRET = process.env.CRON_SECRET

async function handleGet(request: NextRequest) {
  const startTime = Date.now()

  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    log.warn('Unauthorized cron request', { job: 'auto-pause-timers' })
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await autopauseStaleTimers()

    log.info('Cron job succeeded', {
      job: 'auto-pause-timers',
      duration: Date.now() - startTime,
      processed: result.processed,
      paused: result.paused,
      errors: result.errors.length
    })

    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    log.error('Cron job failed', {
      job: 'auto-pause-timers',
      duration: Date.now() - startTime,
      error: sanitizeError(error)
    })

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

export const GET = withLogging(handleGet)
