import type { ApiError } from '@/types/api'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiClientError(
        'An unexpected error occurred',
        response.status,
        'UNKNOWN_ERROR'
      )
    }
    return {} as T
  }

  const json = await response.json()

  if (!response.ok) {
    const error = json.error as ApiError
    throw new ApiClientError(
      error?.message || 'An unexpected error occurred',
      error?.statusCode || response.status,
      error?.code,
      error?.errors
    )
  }

  return json.data as T
}

export async function fetcher<T>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const { params, ...fetchOptions } = options || {}

  let finalUrl = url

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      finalUrl += `?${queryString}`
    }
  }

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
  })

  return handleResponse<T>(response)
}

export function isApiError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
