import { NextRequest } from 'next/server'
import {
  getClientById,
  updateClient,
  deleteClient,
} from '@/lib/services/client.service'
import { updateClientSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const client = await getClientById(id)
    return Response.json({ data: client })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateClientSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const client = await updateClient(id, parsed.data)
    return Response.json({ data: client })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteClient(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
