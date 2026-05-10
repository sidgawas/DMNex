import { apiClient } from './httpClient'
import type { PaginationResponse } from './common.types'
import type {
  ListWorkspacesParams,
  WorkspaceCreateRequest,
  WorkspaceResponse,
  WorkspaceUpdateRequest,
} from './workspace.types'

export type {
  ListWorkspacesParams,
  WorkspaceCreateRequest,
  WorkspaceResponse,
  WorkspaceUpdateRequest,
} from './workspace.types'

const WORKSPACES_PATH = '/api/v1/workspaces'

export async function listWorkspaces(
  params: ListWorkspacesParams = {},
): Promise<PaginationResponse<WorkspaceResponse>> {
  const response = await apiClient.get<PaginationResponse<WorkspaceResponse>>(WORKSPACES_PATH, {
    params,
  })

  return response.data
}

export async function getWorkspaceById(id: string): Promise<WorkspaceResponse> {
  const response = await apiClient.get<WorkspaceResponse>(`${WORKSPACES_PATH}/${encodeURIComponent(id)}`)
  return response.data
}

export async function createWorkspace(
  payload: WorkspaceCreateRequest,
): Promise<WorkspaceResponse> {
  const response = await apiClient.post<WorkspaceResponse>(WORKSPACES_PATH, payload)
  return response.data
}

export async function updateWorkspace(
  id: string,
  payload: WorkspaceUpdateRequest,
): Promise<WorkspaceResponse> {
  const response = await apiClient.put<WorkspaceResponse>(
    `${WORKSPACES_PATH}/${encodeURIComponent(id)}`,
    payload,
  )

  return response.data
}

export async function deleteWorkspace(id: string): Promise<void> {
  await apiClient.delete(`${WORKSPACES_PATH}/${encodeURIComponent(id)}`)
}

export const workspaceApi = {
  listWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
}
