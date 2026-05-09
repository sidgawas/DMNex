import { useContext } from 'react'
import { WorkspaceStoreContext } from './workspace-context'

export function useWorkspaceStore() {
  const context = useContext(WorkspaceStoreContext)

  if (!context) {
    throw new Error('useWorkspaceStore must be used within WorkspaceStoreProvider.')
  }

  return context
}