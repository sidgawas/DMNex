import { createContext } from 'react'

export type Workspace = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type DmnDefinition = {
  id: string
  workspaceId: string
  title: string
  version: string
  filePath: string
  createdAt: string
  updatedAt: string
}

export type WorkspaceStoreValue = {
  workspaces: Workspace[]
  listDmns: (workspaceId: string) => DmnDefinition[]
  getWorkspace: (workspaceId: string) => Workspace | undefined
  getDmn: (workspaceId: string, dmnId: string) => DmnDefinition | undefined
  createWorkspace: (name: string) => Workspace
  createDmn: (workspaceId: string, title: string) => DmnDefinition
  renameDmn: (workspaceId: string, dmnId: string, title: string) => DmnDefinition | undefined
}

export const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null)