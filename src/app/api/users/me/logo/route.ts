import { NextRequest } from 'next/server'
import { uploadLogo, deleteLogo } from '@/lib/services/logo.service'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      throw new ValidationError('No file provided')
    }

    const logoUrl = await uploadLogo(file)
    return Response.json({ data: { logo_url: logoUrl } })
  } catch (error) {
    return handleError(error)
  }
}

async function handleDelete() {
  try {
    await deleteLogo()
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
export const DELETE = withLogging(handleDelete)
