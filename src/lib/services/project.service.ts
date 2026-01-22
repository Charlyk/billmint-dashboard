import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Project, InsertProject, UpdateProject } from '@/types/database'
import type { ProjectWithStats, ProjectListResponse } from '@/types/api'

export async function listProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
}): Promise<ProjectListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('projects')
    .select('*, client:clients(id, name)', { count: 'exact' })
    .eq('user_id', currentUser.id)
    .order('name', { ascending: true })

  if (options?.clientId) {
    query = query.eq('client_id', options.clientId)
  }

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false)
  }

  type ProjectWithClient = Project & { client: { id: string; name: string } | null }
  const result = await query.range(offset, offset + limit - 1) as { data: ProjectWithClient[] | null; error: Error | null; count: number | null }
  const { data, error, count } = result

  if (error) {
    throw new ValidationError('Failed to fetch projects')
  }

  // Get stats for each project
  const projectsWithStats = await Promise.all(
    (data || []).map(async (project) => {
      const stats = await getProjectStats(project.id)
      return {
        ...project,
        ...stats,
      }
    })
  )

  return {
    data: projectsWithStats,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export async function getProjectById(id: string): Promise<ProjectWithStats> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  type ProjectWithClient = Project & { client: { id: string; name: string } | null }
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(id, name)')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: ProjectWithClient | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Project')
  }

  const stats = await getProjectStats(id)

  return {
    ...data,
    ...stats,
  } as ProjectWithStats
}

export async function createProject(
  input: Omit<InsertProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // If this project is set as default, unset other defaults
  if (input.is_default) {
    await supabase
      .from('projects')
      .update({ is_default: false } as never)
      .eq('user_id', currentUser.id)
      .eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...input,
      user_id: currentUser.id,
    } as never)
    .select()
    .single() as { data: Project | null; error: Error | null }

  if (error || !data) {
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

  // Check if project has any time entries
  const { count: entryCount } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  if ((entryCount || 0) > 0) {
    // Archive instead of delete
    await supabase
      .from('projects')
      .update({ is_archived: true, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('user_id', currentUser.id)
    return
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id)

  if (error) {
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

async function getProjectStats(projectId: string): Promise<{
  total_hours: number
  total_amount: number
  unbilled_hours: number
  unbilled_amount: number
}> {
  const supabase = await createClient()

  type EntryStats = { duration_seconds: number; hourly_rate: number | null; is_billable: boolean; invoice_id: string | null }
  const { data: entries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable, invoice_id')
    .eq('project_id', projectId) as { data: EntryStats[] | null }

  if (!entries || entries.length === 0) {
    return {
      total_hours: 0,
      total_amount: 0,
      unbilled_hours: 0,
      unbilled_amount: 0,
    }
  }

  let totalSeconds = 0
  let totalAmount = 0
  let unbilledSeconds = 0
  let unbilledAmount = 0

  for (const entry of entries) {
    const duration = entry.duration_seconds || 0
    const rate = entry.hourly_rate || 0
    const amount = (duration / 3600) * rate

    totalSeconds += duration
    if (entry.is_billable) {
      totalAmount += amount
    }

    if (!entry.invoice_id && entry.is_billable) {
      unbilledSeconds += duration
      unbilledAmount += amount
    }
  }

  return {
    total_hours: Math.round((totalSeconds / 3600) * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100,
    unbilled_hours: Math.round((unbilledSeconds / 3600) * 100) / 100,
    unbilled_amount: Math.round(unbilledAmount * 100) / 100,
  }
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
