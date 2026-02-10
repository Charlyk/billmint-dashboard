import { getInvoices } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const result = await getInvoices()
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}
