import type { PaginationResponse } from './common.types'

export interface DmnCreateRequest {
  title: string
  xml: string
  description?: string
}

export interface DmnUpdateRequest {
  title: string
  xml: string
  description?: string
}

export interface DmnResponseLite {
  id: string
  workspaceId: string
  title: string
  description: string | null
  xml: string
  publishedVersionNumber: number | null
  lastPublishedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  deletedBy: string | null
}

export interface DmnResponse extends DmnResponseLite {
  publishedDmn: {
    id: string
    dmnId: string
    workspaceId: string
    version: number
    title: string
    description: string | null
    xml: string
    createdAt: string
    updatedAt: string
    createdBy: string | null
    updatedBy: string | null
    deletedBy: string | null
  } | null
}

export type ListDmnsParams = {
  page?: number
  size?: number
  query?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type ListDmnsResponse = PaginationResponse<DmnResponseLite>

export type DmnPublishedVersionResponse = {
  id: string
  dmnId: string
  workspaceId: string
  version: number
  title: string
  description: string | null
  xml: string
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  deletedBy: string | null
}
