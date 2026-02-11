import { getInvoices } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const result = await getInvoices()
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
