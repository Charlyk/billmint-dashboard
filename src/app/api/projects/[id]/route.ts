import { NextRequest } from 'next/server'
import {
  getProjectById,
  updateProject,
  deleteProject,
} from '@/lib/services/project.service'
import { updateProjectSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const project = await getProjectById(id)
    return Response.json({ data: project })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateProjectSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const project = await updateProject(id, parsed.data)
    return Response.json({ data: project })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteProject(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
