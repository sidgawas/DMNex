import { useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function DmnEditPage() {
  const { workspaceId, dmnId } = useParams<{ workspaceId: string; dmnId: string }>()
  const { getWorkspace, getDmn, renameDmn } = useWorkspaceStore()

  const workspace = workspaceId ? getWorkspace(workspaceId) : undefined
  const dmn = workspaceId && dmnId ? getDmn(workspaceId, dmnId) : undefined
  const [name, setName] = useState(dmn?.title ?? '')

  if (!workspaceId || !dmnId) {
    return <Alert severity="error">Workspace or DMN context is missing from route.</Alert>
  }

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

  if (!dmn) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">
          DMN not found in this workspace. Isolation is preventing cross-workspace access.
        </Alert>
        <Box>
          <Button component={RouterLink} to={`/workspaces/${workspaceId}/dmns`} variant="contained">
            Back to Workspace DMNs
          </Button>
        </Box>
      </Stack>
    )
  }

  const handleRename = () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    renameDmn(workspaceId, dmnId, trimmedName)
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
          Edit DMN - {workspace.name}
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
          maxWidth: 700,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          Workspace-scoped editor placeholder
        </Typography>

        <TextField
          label="DMN Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleRename}>
            Save Name
          </Button>
        </Box>

        <Typography color="text.secondary">
          Current DMN metadata:
        </Typography>
        <Chip
          icon={<EditNoteOutlinedIcon />}
          color="primary"
          variant="outlined"
          label={`Editing DMN id: ${dmn.id}`}
          sx={{ width: 'fit-content' }}
        />
        <Typography color="text.secondary">File path: {dmn.filePath}</Typography>
      </Paper>
    </Stack>
  )
}

export default DmnEditPage