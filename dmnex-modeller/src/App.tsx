import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { WorkspaceStoreProvider } from './features/workspace/store'
import DmnEditPage from './pages/DmnEditPage'
import DmnListPage from './pages/DmnListPage'
import DmnNewPage from './pages/DmnNewPage'
import WorkspaceCreatePage from './pages/WorkspaceCreatePage'
import WorkspaceListPage from './pages/WorkspaceListPage'

function App() {
  return (
    <WorkspaceStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/workspaces" replace />} />
            <Route path="workspaces" element={<WorkspaceListPage />} />
            <Route path="workspaces/new" element={<WorkspaceCreatePage />} />
            <Route
              path="workspaces/:workspaceId"
              element={<Navigate to="dmns" replace />}
            />
            <Route path="workspaces/:workspaceId/dmns" element={<DmnListPage />} />
            <Route path="workspaces/:workspaceId/dmns/new" element={<DmnNewPage />} />
            <Route
              path="workspaces/:workspaceId/dmns/:dmnId/edit"
              element={<DmnEditPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkspaceStoreProvider>
  )
}

export default App
