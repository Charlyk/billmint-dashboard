import { NextRequest } from 'next/server'
import { listProjects, createProject } from '@/lib/services/project.service'
import { createProjectSchema, paginationSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const page = parsed.success ? parsed.data.page : 1
    const limit = parsed.success ? parsed.data.limit : 20
    const clientId = searchParams.get('clientId') || undefined
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const search = searchParams.get('search') || undefined

    const result = await listProjects({ page, limit, clientId, includeArchived, search })
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const project = await createProject(parsed.data)
    return Response.json({ data: project }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
