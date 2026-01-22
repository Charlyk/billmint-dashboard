'use client'

import useSWR from 'swr'
import { projectsApi } from '@/lib/api'
import { useAuthContext } from '@/contexts'
import type { ProjectListResponse, ProjectWithStats } from '@/types'

export function useProjects(options?: {
  page?: number
  limit?: number
  clientId?: string
  includeArchived?: boolean
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<ProjectListResponse>(
    // Only fetch if authenticated
    isAuthenticated ? ['projects', options] : null,
    () => projectsApi.listProjects(options)
  )

  return {
    projects: data?.data || [],
    pagination: data?.pagination,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useProject(id: string | null) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<ProjectWithStats>(
    isAuthenticated && id ? ['project', id] : null,
    () => (id ? projectsApi.getProject(id) : Promise.resolve(null as unknown as ProjectWithStats))
  )

  return {
    project: data,
    isLoading: authLoading || isLoading,
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
