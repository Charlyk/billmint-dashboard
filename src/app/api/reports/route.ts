import { NextRequest } from 'next/server'
import { generateTimeReport } from '@/lib/services/report.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const project_id = searchParams.get('project_id') || undefined
    const client_id = searchParams.get('client_id') || undefined

    if (!start_date || !end_date) {
      return Response.json(
        { error: { message: 'start_date and end_date are required' } },
        { status: 400 }
      )
    }

    const report = await generateTimeReport({
      start_date,
      end_date,
      project_id,
      client_id,
    })

    return Response.json({ data: report })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
