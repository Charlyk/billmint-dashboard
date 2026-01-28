import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Project, UpdateProject } from '@/types/database'
import type { ProjectWithStats, ProjectListResponse } from '@/types/api'

export async function listProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
  search?: string
}): Promise<ProjectListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('list_projects', {
    p_user_id: currentUser.id,
    p_page: options?.page || 1,
    p_limit: options?.limit || 20,
    p_client_id: options?.clientId || null,
    p_include_archived: options?.includeArchived || false,
    p_search: options?.search || null,
  }) as { data: ProjectListResponse | null; error: Error | null }

  if (error) {
    console.error('[Project] list_projects RPC error:', error)
    throw new ValidationError('Failed to fetch projects')
  }

  if (!data) {
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 20,
        total: 0,
        totalPages: 0,
      },
    }
  }

  return data
}

export async function getProjectById(id: string): Promise<ProjectWithStats> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_project_with_stats', {
    p_user_id: currentUser.id,
    p_project_id: id,
  }) as { data: ProjectWithStats | null; error: Error | null }

  if (error) {
    console.error('[Project] get_project_with_stats RPC error:', error)
    throw new ValidationError('Failed to fetch project')
  }

  if (!data) {
    throw new NotFoundError('Project')
  }

  return data
}

export async function createProject(
  input: {
    name: string
    client_id?: string | null
    color?: string
    hourly_rate?: number | null
    is_billable?: boolean
    is_default?: boolean
    notes?: string | null
  }
): Promise<Project> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Currency is now derived from client or user settings in the RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_project', {
    p_user_id: currentUser.id,
    p_name: input.name,
    p_client_id: input.client_id || null,
    p_color: input.color || '#6366f1',
    p_hourly_rate: input.hourly_rate || null,
    p_currency: 'USD', // Legacy param - will be overridden by RPC based on client/settings
    p_is_billable: input.is_billable ?? true,
    p_is_default: input.is_default || false,
    p_notes: input.notes || null,
  }) as { data: Project | null; error: Error | null }

  if (error) {
    console.error('[Project] create_project RPC error:', error)
    throw new ValidationError('Failed to create project')
  }

  if (!data) {
    throw new ValidationError('Failed to create project')
  }

  return data
}

export async function updateProject(
  id: string,
  input: UpdateProject
): Promise<Project> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // If this project is being set as default, unset other defaults
  if (input.is_default) {
    await supabase
      .from('projects')
      .update({ is_default: false } as never)
      .eq('user_id', currentUser.id)
      .eq('is_default', true)
      .neq('id', id)
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single() as { data: Project | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Project')
  }

  return data
}

export async function deleteProject(id: string): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('delete_project', {
    p_user_id: currentUser.id,
    p_project_id: id,
  })

  if (error) {
    console.error('[Project] delete_project RPC error:', error)
    throw new ValidationError('Failed to delete project')
  }
}

export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { is_archived: true })
}

export async function unarchiveProject(id: string): Promise<Project> {
  return updateProject(id, { is_archived: false })
}

export async function getDefaultProject(): Promise<Project | null> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('is_default', true)
    .eq('is_archived', false)
    .single()

  return data || null
}

export async function getProjectEntries(
  projectId: string,
  options?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }
) {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', currentUser.id)
    .single()

  if (!project) {
    throw new NotFoundError('Project')
  }

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('time_entries')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('start_time', { ascending: false })

  if (options?.startDate) {
    query = query.gte('start_time', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('start_time', options.endDate)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    throw new ValidationError('Failed to fetch project entries')
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
