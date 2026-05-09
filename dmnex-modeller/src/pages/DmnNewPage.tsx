import { useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function DmnNewPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { createDmn, getWorkspace } = useWorkspaceStore()

  if (!workspaceId) {
    return <Alert severity="error">Workspace context is missing from route.</Alert>
  }

  const workspace = getWorkspace(workspaceId)

  if (!workspace) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">Workspace not found. Pick another workspace.</Alert>
        <Box>
          <Button component={RouterLink} to="/workspaces" variant="contained">
            Go to Workspaces
          </Button>
        </Box>
      </Stack>
    )
  }

  const handleCreateDmn = () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('DMN name is required.')
      return
    }

    setError(null)
    const dmn = createDmn(workspaceId, trimmedName)
    navigate(`/workspaces/${workspaceId}/dmns/${dmn.id}/edit`)
  }

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 750, letterSpacing: '-0.02em' }}>
          Create DMN - {workspace.name}
        </Typography>
        <Button
          component={RouterLink}
          to={`/workspaces/${workspaceId}/dmns`}
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
        >
          Back to list
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          display: 'grid',
          gap: 2,
          maxWidth: 620,
        }}
      >
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="DMN Name"
          placeholder="Loan Eligibility"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />

        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          Workspace isolation is active
        </Typography>
        <Typography color="text.secondary">
          The created DMN will belong only to {workspace.name} and will not appear in other
          workspaces.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleCreateDmn} startIcon={<SaveOutlinedIcon />}>
            Create DMN
          </Button>
        </Box>
      </Paper>
    </Stack>
  )
}

export default DmnNewPage