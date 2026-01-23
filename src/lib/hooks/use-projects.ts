'use client'

import useSWR from 'swr'
import { projectsApi } from '@/lib/api'
import type { ProjectListResponse, ProjectWithStats } from '@/types'

export function useProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
  search?: string
}) {
  const { data, error, isLoading, mutate } = useSWR<ProjectListResponse>(
    ['projects', options],
    () => projectsApi.listProjects(options)
  )

  return {
    projects: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProjectWithStats>(
    id ? ['project', id] : null,
    () => (id ? projectsApi.getProject(id) : Promise.resolve(null as unknown as ProjectWithStats))
  )

  return {
    project: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useProjectMutations() {
  return {
    createProject: projectsApi.createProject,
    updateProject: projectsApi.updateProject,
    deleteProject: projectsApi.deleteProject,
  }
}
