import type { DmnResponse, DmnResponseLite } from '../../api/dmnApi'
import { createContext } from 'react'

export type Workspace = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type DmnDefinition = DmnResponseLite

export type WorkspaceStoreValue = {
  workspaces: Workspace[]
  workspacesPage: number
  workspacesPageSize: number
  workspacesTotalPages: number
  workspacesTotalItems: number
  workspacesHasNext: boolean
  workspacesHasPrevious: boolean
  isWorkspacesLoading: boolean
  workspacesError: string | null
  dmns: DmnDefinition[]
  dmnsPage: number
  dmnsPageSize: number
  dmnsTotalPages: number
  dmnsTotalItems: number
  dmnsHasNext: boolean
  dmnsHasPrevious: boolean
  isDmnsLoading: boolean
  dmnsError: string | null
  currentActiveWorkspaceId: string | null
  setCurrentActiveWorkspaceId: (workspaceId: string | null) => void
  refreshWorkspaces: (
    targetPage?: number,
    targetSize?: number,
    targetSortBy?: string,
    targetSortOrder?: 'asc' | 'desc',
    targetQuery?: string,
  ) => Promise<void>
  setWorkspacesPageSize: (pageSize: number) => Promise<void>
  updateWorkspaceName: (workspaceId: string, name: string) => Promise<Workspace>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  refreshDmns: (
    workspaceId: string,
    targetPage?: number,
    targetSize?: number,
    targetSortBy?: string,
    targetSortOrder?: 'asc' | 'desc',
    targetQuery?: string,
  ) => Promise<void>
  setDmnsPageSize: (pageSize: number) => Promise<void>
  listDmns: (workspaceId: string) => DmnDefinition[]
  getWorkspace: (workspaceId: string) => Workspace | undefined
  getDmn: (workspaceId: string, dmnId: string) => Promise<DmnResponse | undefined>
  createWorkspace: (name: string) => Promise<Workspace>
  createDmn: (workspaceId: string, title: string, xml: string, description?: string) => Promise<DmnDefinition>
  updateDmn: (workspaceId: string, dmnId: string, title: string, xml: string, description?: string) => Promise<DmnDefinition>
  deleteDmn: (workspaceId: string, dmnId: string) => Promise<void>
}

export const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null)