import { NextRequest } from 'next/server'
import { getProjectEntries } from '@/lib/services/project.service'
import { paginationSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
