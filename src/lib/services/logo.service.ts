import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'
import { createServiceLogger } from '@/lib/logging/logger'
import { sanitizeError } from '@/lib/logging/sanitizers'

const log = createServiceLogger('logo')

const BUCKET_NAME = 'logos'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadLogo(file: File): Promise<string> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File size must be less than 2MB')
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('File must be PNG, JPEG, or WebP')
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'png'
  const timestamp = Date.now()
  const filePath = `${currentUser.id}/${timestamp}.${ext}`

  // Delete old logo if exists
  const { data: settings } = await supabase
    .from('user_settings')
    .select('logo_url')
    .eq('user_id', currentUser.id)
    .single() as { data: { logo_url: string | null } | null; error: Error | null }

  if (settings?.logo_url) {
    // Extract the file path from the URL
    const oldPath = extractPathFromUrl(settings.logo_url)
    if (oldPath) {
      await supabase.storage.from(BUCKET_NAME).remove([oldPath])
    }
  }

  // Upload new logo
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    log.error('Storage upload error', {
      operation: 'upload_logo',
      userId: currentUser.id,
      bucketName: BUCKET_NAME,
      fileName: filePath,
      error: sanitizeError(uploadError),
    })
    throw new ValidationError('Failed to upload logo')
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  const logoUrl = urlData.publicUrl

  // Update user_settings with the new logo URL
  const { error: updateError } = await supabase
    .from('user_settings')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() } as never)
    .eq('user_id', currentUser.id)

  if (updateError) {
    log.error('Failed to update settings with logo URL', {
      operation: 'update_settings_logo_url',
      userId: currentUser.id,
      error: sanitizeError(updateError),
    })
    // Try to clean up the uploaded file
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    throw new ValidationError('Failed to save logo URL')
  }

  return logoUrl
}

export async function deleteLogo(): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Get current logo URL
  const { data: settings } = await supabase
    .from('user_settings')
    .select('logo_url')
    .eq('user_id', currentUser.id)
    .single() as { data: { logo_url: string | null } | null; error: Error | null }

  if (!settings?.logo_url) {
    return // No logo to delete
  }

  // Extract the file path from the URL
  const filePath = extractPathFromUrl(settings.logo_url)
  if (filePath) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      log.error('Storage delete error', {
        operation: 'delete_logo',
        userId: currentUser.id,
        bucketName: BUCKET_NAME,
        fileName: filePath,
        error: sanitizeError(deleteError),
      })
      // Continue anyway to clear the URL
    }
  }

  // Clear logo_url in user_settings
  const { error: updateError } = await supabase
    .from('user_settings')
    .update({ logo_url: null, updated_at: new Date().toISOString() } as never)
    .eq('user_id', currentUser.id)

  if (updateError) {
    log.error('Failed to clear logo URL from settings', {
      operation: 'clear_logo_url',
      userId: currentUser.id,
      error: sanitizeError(updateError),
    })
    throw new ValidationError('Failed to remove logo')
  }
}

function extractPathFromUrl(url: string): string | null {
  try {
    // URL format: .../storage/v1/object/public/logos/{user_id}/{timestamp}.{ext}
    const match = url.match(/\/logos\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
