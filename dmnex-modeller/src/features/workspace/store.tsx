import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { workspaceApi } from '../../api/workspaceApi'
import {
  WorkspaceStoreContext,
  type DmnDefinition,
  type Workspace,
  type WorkspaceStoreValue,
} from './workspace-context'

const STORAGE_KEY = 'dmnex.workspace-store.v1'

type WorkspaceStoreState = {
  workspaces: Workspace[]
  dmns: DmnDefinition[]
}

type WorkspacePaginationState = {
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getInitialState = (): WorkspaceStoreState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return { workspaces: [], dmns: [] }
    }

    const parsed = JSON.parse(raw) as WorkspaceStoreState
    return {
      workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
      dmns: Array.isArray(parsed.dmns) ? parsed.dmns : [],
    }
  } catch {
    return { workspaces: [], dmns: [] }
  }
}

type WorkspaceStoreProviderProps = {
  children: ReactNode
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
const DEFAULT_WORKSPACE_SORT_BY = 'name'
const DEFAULT_WORKSPACE_SORT_ORDER = 'asc' as const

export function WorkspaceStoreProvider({ children }: WorkspaceStoreProviderProps) {
  const [state, setState] = useState<WorkspaceStoreState>(() => getInitialState())
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

  const persist = useCallback((nextState: WorkspaceStoreState) => {
    setState(nextState)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  }, [])

  const getWorkspace = useCallback(
    (workspaceId: string) => state.workspaces.find((workspace) => workspace.id === workspaceId),
    [state.workspaces],
  )

  const listDmns = useCallback(
    (workspaceId: string) =>
      state.dmns
        .filter((dmn) => dmn.workspaceId === workspaceId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [state.dmns],
  )

  const getDmn = useCallback(
    (workspaceId: string, dmnId: string) =>
      state.dmns.find((dmn) => dmn.workspaceId === workspaceId && dmn.id === dmnId),
    [state.dmns],
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
    (workspaceId: string, title: string) => {
      const workspace = state.workspaces.find((item) => item.id === workspaceId)

      if (!workspace) {
        throw new Error('Workspace does not exist.')
      }

      const now = new Date().toISOString()
      const sanitizedTitle = title.trim()
      const dmnId = createId()
      const filePathSlug = slugify(sanitizedTitle) || `decision-${state.dmns.length + 1}`

      const dmn: DmnDefinition = {
        id: dmnId,
        workspaceId,
        title: sanitizedTitle,
        version: '0.1.0',
        filePath: `models/${filePathSlug}.dmn`,
        createdAt: now,
        updatedAt: now,
      }

      persist({
        ...state,
        workspaces: state.workspaces.map((item) =>
          item.id === workspaceId ? { ...item, updatedAt: now } : item,
        ),
        dmns: [dmn, ...state.dmns],
      })

      return dmn
    },
    [persist, state],
  )

  const renameDmn = useCallback(
    (workspaceId: string, dmnId: string, title: string) => {
      const index = state.dmns.findIndex(
        (dmn) => dmn.workspaceId === workspaceId && dmn.id === dmnId,
      )

      if (index < 0) {
        return undefined
      }

      const now = new Date().toISOString()
      const nextDmns = [...state.dmns]
      const current = nextDmns[index]

      nextDmns[index] = {
        ...current,
        title: title.trim(),
        updatedAt: now,
      }

      const nextState: WorkspaceStoreState = {
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, updatedAt: now } : workspace,
        ),
        dmns: nextDmns,
      }

      persist(nextState)
      return nextState.dmns[index]
    },
    [persist, state.dmns, state.workspaces],
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
      refreshWorkspaces,
      setWorkspacesPageSize,
      updateWorkspaceName,
      deleteWorkspace,
      listDmns,
      getWorkspace,
      getDmn,
      createWorkspace,
      createDmn,
      renameDmn,
    }),
    [
      createDmn,
      createWorkspace,
      deleteWorkspace,
      getDmn,
      getWorkspace,
      isWorkspacesLoading,
      listDmns,
      refreshWorkspaces,
      renameDmn,
      setWorkspacesPageSize,
      updateWorkspaceName,
      workspacePagination.hasNext,
      workspacePagination.hasPrevious,
      workspacePagination.page,
      workspacePagination.size,
      workspacePagination.totalItems,
      workspacePagination.totalPages,
      state.workspaces,
      workspacesError,
    ],
  )

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>
}

