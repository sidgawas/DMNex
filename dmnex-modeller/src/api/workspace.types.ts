export type WorkspaceResponse = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
}

export type WorkspaceCreateRequest = {
  name: string
}

export type WorkspaceUpdateRequest = {
  name: string
}

export type ListWorkspacesParams = {
  page?: number
  size?: number
  query?: string
}
