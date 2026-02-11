import { NextRequest } from 'next/server'
import { bulkDeleteTimeEntries, bulkUpdateTimeEntries } from '@/lib/services/time-entry.service'
import { bulkTimeEntryActionSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bulkTimeEntryActionSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const { action, entry_ids } = parsed.data
    let affected_count = 0

    switch (action) {
      case 'delete':
        affected_count = await bulkDeleteTimeEntries(entry_ids)
        break
      case 'mark-billable':
        affected_count = await bulkUpdateTimeEntries(entry_ids, { is_billable: true })
        break
      case 'mark-non-billable':
        affected_count = await bulkUpdateTimeEntries(entry_ids, { is_billable: false })
        break
    }

    return Response.json({ data: { success: true, affected_count } })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
