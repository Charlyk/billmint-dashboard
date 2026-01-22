import { NextRequest } from 'next/server'
import { getUnbilledTimeEntries } from '@/lib/services/time-entry.service'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || undefined

    const unbilled = await getUnbilledTimeEntries(clientId)
    return Response.json({ data: unbilled })
  } catch (error) {
    return handleError(error)
  }
}
