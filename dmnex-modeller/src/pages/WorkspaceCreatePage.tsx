import { useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function WorkspaceCreatePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { createWorkspace } = useWorkspaceStore()

  const handleCreateWorkspace = () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Workspace name is required.')
      return
    }

    setError(null)
    const workspace = createWorkspace(trimmedName)
    navigate(`/workspaces/${workspace.id}/dmns`)
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
          Create Workspace
        </Typography>
        <Button
          component={RouterLink}
          to="/workspaces"
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
        >
          Back to Workspaces
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
          label="Workspace Name"
          placeholder="Risk Management"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleCreateWorkspace}
            startIcon={<SaveOutlinedIcon />}
          >
            Create Workspace
          </Button>
        </Box>
      </Paper>
    </Stack>
  )
}

export default WorkspaceCreatePage