import { NextRequest } from 'next/server'
import { exportTimeReport } from '@/lib/services/report.service'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const project_id = searchParams.get('project_id') || undefined
    const client_id = searchParams.get('client_id') || undefined
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'json'

    if (!start_date || !end_date) {
      return Response.json(
        { error: { message: 'start_date and end_date are required' } },
        { status: 400 }
      )
    }

    const { content, filename, mimeType } = await exportTimeReport(
      {
        start_date,
        end_date,
        project_id,
        client_id,
      },
      format
    )

    return new Response(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
