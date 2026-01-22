import { NextRequest } from 'next/server'
import { listClients, createClient as createClientService } from '@/lib/services/client.service'
import { createClientSchema, paginationSchema } from '@/lib/utils/validation'
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
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const clients = await listClients({ page, limit, includeArchived })
    return Response.json({ data: clients })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const client = await createClientService(parsed.data)
    return Response.json({ data: client }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
