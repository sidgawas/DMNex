import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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

export function WorkspaceStoreProvider({ children }: WorkspaceStoreProviderProps) {
  const [state, setState] = useState<WorkspaceStoreState>(() => getInitialState())

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

  const createWorkspace = useCallback(
    (name: string) => {
      const now = new Date().toISOString()
      const normalizedName = name.trim()
      const baseSlug = slugify(normalizedName) || `workspace-${state.workspaces.length + 1}`

      const existingSlugs = new Set(state.workspaces.map((workspace) => workspace.slug))

      let nextSlug = baseSlug
      let counter = 2

      while (existingSlugs.has(nextSlug)) {
        nextSlug = `${baseSlug}-${counter}`
        counter += 1
      }

      const workspace: Workspace = {
        id: createId(),
        name: normalizedName,
        slug: nextSlug,
        createdAt: now,
        updatedAt: now,
      }

      persist({
        ...state,
        workspaces: [workspace, ...state.workspaces],
      })

      return workspace
    },
    [persist, state],
  )

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
      listDmns,
      getWorkspace,
      getDmn,
      createWorkspace,
      createDmn,
      renameDmn,
    }),
    [createDmn, createWorkspace, getDmn, getWorkspace, listDmns, renameDmn, state.workspaces],
  )

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>
}

