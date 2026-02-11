import { fetcher } from './client'
import type { Project, ProjectWithStats, ProjectListResponse } from '@/types'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/utils/validation'
import { analytics } from '@/lib/analytics/events'

export async function listProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
  search?: string
}): Promise<ProjectListResponse> {
  return fetcher<ProjectListResponse>('/api/projects', {
    params: {
      page: options?.page,
      limit: options?.limit,
      clientId: options?.clientId,
      includeArchived: options?.includeArchived,
      search: options?.search,
    },
  })
}

export async function getProject(id: string): Promise<ProjectWithStats> {
  return fetcher<ProjectWithStats>(`/api/projects/${id}`)
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const result = await fetcher<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  analytics.projectCreated({
    project_id: result.id,
    client_id: result.client_id ?? null,
  })
  return result
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  const result = await fetcher<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  // Detect archive vs. regular edit
  if (data.is_archived === true) {
    analytics.projectArchived({ project_id: result.id })
  } else {
    analytics.projectEdited({ project_id: result.id })
  }
  return result
}

export async function deleteProject(id: string): Promise<void> {
  await fetcher(`/api/projects/${id}`, { method: 'DELETE' })
}
