import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { dmnApi } from '../../api/dmnApi'
import { workspaceApi } from '../../api/workspaceApi'
import {
  WorkspaceStoreContext,
  type DmnDefinition,
  type Workspace,
  type WorkspaceStoreValue,
} from './workspace-context'

type WorkspaceStoreState = {
  workspaces: Workspace[]
}

type WorkspacePaginationState = {
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

type DmnPaginationState = {
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

const toWorkspace = (workspace: {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}): Workspace => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
})

const WORKSPACES_PAGE_SIZE = 10
const DMNS_PAGE_SIZE = 20
const DEFAULT_WORKSPACE_SORT_BY = 'name'
const DEFAULT_WORKSPACE_SORT_ORDER = 'asc' as const
const DEFAULT_DMN_SORT_BY = 'updatedAt'
const DEFAULT_DMN_SORT_ORDER = 'desc' as const

type WorkspaceStoreProviderProps = {
  children: ReactNode
}

export function WorkspaceStoreProvider({ children }: WorkspaceStoreProviderProps) {
  const [state, setState] = useState<WorkspaceStoreState>({ workspaces: [] })
  const [workspacePagination, setWorkspacePagination] = useState<WorkspacePaginationState>({
    page: 0,
    size: WORKSPACES_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })
  const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(true)
  const [workspacesError, setWorkspacesError] = useState<string | null>(null)

  const [dmns, setDmns] = useState<DmnDefinition[]>([])
  const [dmnPagination, setDmnPagination] = useState<DmnPaginationState>({
    page: 0,
    size: DMNS_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })
  const [isDmnsLoading, setIsDmnsLoading] = useState(false)
  const [dmnsError, setDmnsError] = useState<string | null>(null)
  const [currentActiveWorkspaceId, setCurrentActiveWorkspaceId] = useState<string | null>(null)

  const getWorkspace = useCallback(
    (workspaceId: string) => state.workspaces.find((workspace) => workspace.id === workspaceId),
    [state.workspaces],
  )

  const listDmns = useCallback(
    (workspaceId: string) =>
      currentActiveWorkspaceId === workspaceId
        ? dmns
        : [],
    [dmns, currentActiveWorkspaceId],
  )

  const getDmn = useCallback(
    async (workspaceId: string, dmnId: string) =>
      currentActiveWorkspaceId === workspaceId
        ? await dmnApi.getDmnById(workspaceId, dmnId)
        : undefined,
    [dmns, currentActiveWorkspaceId],
  )

  const refreshWorkspaces = useCallback(async (
    targetPage?: number,
    targetSize?: number,
    targetSortBy?: string,
    targetSortOrder?: 'asc' | 'desc',
    targetQuery?: string,
  ) => {
    setIsWorkspacesLoading(true)
    setWorkspacesError(null)

    try {
      const requestedPage = targetPage ?? workspacePagination.page
      const requestedSize = targetSize ?? workspacePagination.size
      const requestedSortBy = targetSortBy ?? DEFAULT_WORKSPACE_SORT_BY
      const requestedSortOrder = targetSortOrder ?? DEFAULT_WORKSPACE_SORT_ORDER
      const requestedQuery = targetQuery?.trim()
      const response = await workspaceApi.listWorkspaces({
        page: requestedPage,
        size: requestedSize,
        sortBy: requestedSortBy,
        sortOrder: requestedSortOrder,
        query: requestedQuery ? requestedQuery : undefined,
      })

      setState((previous) => ({
        ...previous,
        workspaces: response.items.map(toWorkspace),
      }))
      setWorkspacePagination((previous) => ({
        ...previous,
        page: response.page,
        size: response.size,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
      }))
    } catch {
      setWorkspacesError('Failed to load workspaces. Please try again.')
    } finally {
      setIsWorkspacesLoading(false)
    }
  }, [workspacePagination.page, workspacePagination.size])

  const setWorkspacesPageSize = useCallback(
    async (pageSize: number) => {
      await refreshWorkspaces(0, pageSize)
    },
    [refreshWorkspaces],
  )

  const refreshDmns = useCallback(
    async (
      workspaceId: string,
      targetPage?: number,
      targetSize?: number,
      targetSortBy?: string,
      targetSortOrder?: 'asc' | 'desc',
      targetQuery?: string,
    ) => {
      setIsDmnsLoading(true)
      setDmnsError(null)
      setCurrentActiveWorkspaceId(workspaceId)

      try {
        const requestedPage = targetPage ?? dmnPagination.page
        const requestedSize = targetSize ?? dmnPagination.size
        const requestedSortBy = targetSortBy ?? DEFAULT_DMN_SORT_BY
        const requestedSortOrder = targetSortOrder ?? DEFAULT_DMN_SORT_ORDER
        const requestedQuery = targetQuery?.trim()

        const response = await dmnApi.listDmns(workspaceId, {
          page: requestedPage,
          size: requestedSize,
          sortBy: requestedSortBy,
          sortOrder: requestedSortOrder,
          query: requestedQuery ? requestedQuery : undefined,
        })

        setDmns(response.items)
        setDmnPagination((previous) => ({
          ...previous,
          page: response.page,
          size: response.size,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
          hasPrevious: response.hasPrevious,
        }))
      } catch {
        setDmnsError('Failed to load DMNs. Please try again.')
      } finally {
        setIsDmnsLoading(false)
      }
    },
    [dmnPagination.page, dmnPagination.size],
  )

  const setDmnsPageSize = useCallback(
    async (pageSize: number) => {
      if (!currentActiveWorkspaceId) return
      await refreshDmns(currentActiveWorkspaceId, 0, pageSize)
    },
    [currentActiveWorkspaceId, refreshDmns],
  )

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refreshWorkspaces()
    }, 0)

    return () => {
      window.clearTimeout(refreshTimer)
    }
  }, [refreshWorkspaces])

  const createWorkspace = useCallback(
    async (name: string) => {
      const created = await workspaceApi.createWorkspace({ name: name.trim() })
      const workspace = toWorkspace(created)

      void refreshWorkspaces(0)

      return workspace
    },
    [refreshWorkspaces],
  )

  const updateWorkspaceName = useCallback(
    async (workspaceId: string, name: string) => {
      const updated = await workspaceApi.updateWorkspace(workspaceId, { name: name.trim() })
      const workspace = toWorkspace(updated)

      await refreshWorkspaces(workspacePagination.page, workspacePagination.size)

      return workspace
    },
    [refreshWorkspaces, workspacePagination.page, workspacePagination.size],
  )

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    await workspaceApi.deleteWorkspace(workspaceId)
  }, [])

  const createDmn = useCallback(
    async (workspaceId: string, title: string, xml: string, description?: string) => {
      const created = await dmnApi.createDmn(workspaceId, {
        title: title.trim(),
        xml,
        description: description?.trim(),
      })

      // Refresh DMN list for this workspace
      if (currentActiveWorkspaceId === workspaceId) {
        await refreshDmns(workspaceId, 0)
      }

      return created
    },
    [currentActiveWorkspaceId, refreshDmns],
  )

  const deleteDmn = useCallback(
    async (workspaceId: string, dmnId: string) => {
      await dmnApi.deleteDmn(workspaceId, dmnId)

      // Refresh DMN list for this workspace
      if (currentActiveWorkspaceId === workspaceId) {
        await refreshDmns(workspaceId)
      }
    },
    [currentActiveWorkspaceId, refreshDmns],
  )

  const updateDmn = useCallback(
    async (workspaceId: string, dmnId: string, title: string, xml: string, description?: string) => {
      const updated = await dmnApi.updateDmn(workspaceId, dmnId, {
        title: title.trim(),
        xml,
        description: description?.trim(),
      })

      // Update DMN in local state if it's the current workspace
      if (currentActiveWorkspaceId === workspaceId) {
        setDmns((prevDmns) =>
          prevDmns.map((dmn) => (dmn.id === dmnId ? updated : dmn)),
        )
      }

      return updated
    },
    [currentActiveWorkspaceId],
  )

  const value = useMemo<WorkspaceStoreValue>(
    () => ({
      workspaces: state.workspaces,
      workspacesPage: workspacePagination.page,
      workspacesPageSize: workspacePagination.size,
      workspacesTotalPages: workspacePagination.totalPages,
      workspacesTotalItems: workspacePagination.totalItems,
      workspacesHasNext: workspacePagination.hasNext,
      workspacesHasPrevious: workspacePagination.hasPrevious,
      isWorkspacesLoading,
      workspacesError,
      dmns,
      dmnsPage: dmnPagination.page,
      dmnsPageSize: dmnPagination.size,
      dmnsTotalPages: dmnPagination.totalPages,
      dmnsTotalItems: dmnPagination.totalItems,
      dmnsHasNext: dmnPagination.hasNext,
      dmnsHasPrevious: dmnPagination.hasPrevious,
      isDmnsLoading,
      dmnsError,
      currentActiveWorkspaceId,
      setCurrentActiveWorkspaceId,
      refreshWorkspaces,
      setWorkspacesPageSize,
      updateWorkspaceName,
      deleteWorkspace,
      refreshDmns,
      setDmnsPageSize,
      listDmns,
      getWorkspace,
      getDmn,
      createWorkspace,
      createDmn,
      deleteDmn,
      updateDmn,
    }),
    [
      createDmn,
      createWorkspace,
      deleteWorkspace,
      deleteDmn,
      updateDmn,
      dmnPagination.hasNext,
      dmnPagination.hasPrevious,
      dmnPagination.page,
      dmnPagination.size,
      dmnPagination.totalItems,
      dmnPagination.totalPages,
      dmns,
      dmnsError,
      getDmn,
      getWorkspace,
      isDmnsLoading,
      isWorkspacesLoading,
      listDmns,
      refreshDmns,
      refreshWorkspaces,
      setDmnsPageSize,
      setWorkspacesPageSize,
      state.workspaces,
      updateWorkspaceName,
      workspacePagination.hasNext,
      workspacePagination.hasPrevious,
      workspacePagination.page,
      workspacePagination.size,
      workspacePagination.totalItems,
      workspacePagination.totalPages,
      workspacesError,
      currentActiveWorkspaceId,
      setCurrentActiveWorkspaceId,
    ],
  )

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>
}

