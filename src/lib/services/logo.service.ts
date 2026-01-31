import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'

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
    console.error('[Logo] Upload error:', uploadError)
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
    console.error('[Logo] Update settings error:', updateError)
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
      console.error('[Logo] Delete storage error:', deleteError)
      // Continue anyway to clear the URL
    }
  }

  // Clear logo_url in user_settings
  const { error: updateError } = await supabase
    .from('user_settings')
    .update({ logo_url: null, updated_at: new Date().toISOString() } as never)
    .eq('user_id', currentUser.id)

  if (updateError) {
    console.error('[Logo] Update settings error:', updateError)
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
