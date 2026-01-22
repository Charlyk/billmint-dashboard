import { fetcher } from './client'
import type { Project, ProjectWithStats, ProjectListResponse } from '@/types'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/utils/validation'

export async function listProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
}): Promise<ProjectListResponse> {
  return fetcher<ProjectListResponse>('/api/projects', {
    params: {
      page: options?.page,
      limit: options?.limit,
      clientId: options?.clientId,
      includeArchived: options?.includeArchived,
    },
  })
}

export async function getProject(id: string): Promise<ProjectWithStats> {
  return fetcher<ProjectWithStats>(`/api/projects/${id}`)
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  return fetcher<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  return fetcher<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await fetcher(`/api/projects/${id}`, { method: 'DELETE' })
}
