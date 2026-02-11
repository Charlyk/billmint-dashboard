import { NextRequest } from 'next/server'
import { getProjectEntries } from '@/lib/services/project.service'
import { paginationSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const page = parsed.success ? parsed.data.page : 1
    const limit = parsed.success ? parsed.data.limit : 20
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const entries = await getProjectEntries(id, {
      page,
      limit,
      startDate,
      endDate,
    })

    return Response.json({ data: entries })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet as any)
