import { apiClient } from './httpClient'
import type {
  DmnCreateRequest,
  DmnPublishedVersionResponse,
  DmnResponse,
  DmnUpdateRequest,
  ListDmnsParams,
  ListDmnsResponse,
} from './dmn.types'

export type {
  DmnCreateRequest,
  DmnPublishedVersionResponse,
  DmnResponse,
  DmnResponseLite,
  DmnUpdateRequest,
  ListDmnsParams,
  ListDmnsResponse,
} from './dmn.types'

const DMNS_PATH = '/api/v1/workspaces'

export async function listDmns(
  workspaceId: string,
  params: ListDmnsParams = {},
): Promise<ListDmnsResponse> {
  const response = await apiClient.get<ListDmnsResponse>(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns`,
    { params },
  )
  return response.data
}

export async function getDmnById(workspaceId: string, dmnId: string): Promise<DmnResponse> {
  const response = await apiClient.get<DmnResponse>(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns/${encodeURIComponent(dmnId)}`,
  )
  return response.data
}

export async function createDmn(
  workspaceId: string,
  payload: DmnCreateRequest,
): Promise<DmnResponse> {
  const response = await apiClient.post<DmnResponse>(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns`,
    payload,
  )
  return response.data
}

export async function updateDmn(
  workspaceId: string,
  dmnId: string,
  payload: DmnUpdateRequest,
): Promise<DmnResponse> {
  const response = await apiClient.put<DmnResponse>(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns/${encodeURIComponent(dmnId)}`,
    payload,
  )
  return response.data
}

export async function deleteDmn(workspaceId: string, dmnId: string): Promise<void> {
  await apiClient.delete(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns/${encodeURIComponent(dmnId)}`,
  )
}

export async function publishDmn(
  workspaceId: string,
  dmnId: string,
): Promise<DmnPublishedVersionResponse> {
  const response = await apiClient.post<DmnPublishedVersionResponse>(
    `${DMNS_PATH}/${encodeURIComponent(workspaceId)}/dmns/${encodeURIComponent(dmnId)}/publish`,
  )
  return response.data
}

export const dmnApi = {
  listDmns,
  getDmnById,
  createDmn,
  updateDmn,
  deleteDmn,
  publishDmn,
}
