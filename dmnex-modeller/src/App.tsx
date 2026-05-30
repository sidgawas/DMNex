import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { WorkspaceStoreProvider } from './features/workspace/store'
import DmnEditPage from './pages/DmnEditPage'
import DmnListPage from './pages/DmnListPage'
import DmnNewPage from './pages/DmnNewPage'
import WorkspaceCreatePage from './pages/WorkspaceCreatePage'
import WorkspaceListPage from './pages/WorkspaceListPage'
import { WorkspacesOutlet } from './pages/WorkspacesOutlet'

const appTheme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
})

function App() {
  return (
    <WorkspaceStoreProvider>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/workspaces" replace />} />
              <Route path="workspaces" element={<WorkspacesOutlet />}>
                <Route index element={<WorkspaceListPage />} />
                <Route path="new" element={<WorkspaceCreatePage />} />
                <Route path=":workspaceId" element={<Navigate to="dmns" replace />} />
                <Route path=":workspaceId/dmns" element={<DmnListPage />} />
                <Route path=":workspaceId/dmns/new" element={<DmnNewPage />} />
                <Route
                  path=":workspaceId/dmns/:dmnId/edit"
                  element={<DmnEditPage />}
                />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </WorkspaceStoreProvider>
  )
}

export default App
