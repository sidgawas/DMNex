import { useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
 import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

// Minimal DMN template
const DEFAULT_DMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" xmlns:dc="http://www.omg.org/spec/DMN/20191111/DC/" xmlns:di="http://www.omg.org/spec/DMN/20191111/DI/" id="definitions_1" name="Decision Model" namespaceURI="https://dmnex.example.com">
  <decision id="decision_1" name="Decision 1">
    <decisionTable id="decisionTable_1">
      <input id="input_1">
        <inputExpression typeRef="string" />
      </input>
      <output id="output_1" typeRef="string" />
      <rule id="rule_1">
        <inputEntry id="inputEntry_1_1">
          <text>-</text>
        </inputEntry>
        <outputEntry id="outputEntry_1_1">
          <text>"output"</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
</definitions>`

function DmnNewPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleCreateDmn = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('DMN name is required.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const dmn = await createDmn(
        workspaceId,
        trimmedName,
        DEFAULT_DMN_XML,
        description.trim() || undefined,
      )
      navigate(`/workspaces/${workspaceId}/dmns/${dmn.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DMN. Please try again.')
      setIsLoading(false)
    }
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
          disabled={isLoading}
        />

        <TextField
          label="Description (optional)"
          placeholder="Describe the purpose of this DMN..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={isLoading}
        />

        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          Workspace isolation is active
        </Typography>
        <Typography color="text.secondary">
          The created DMN will belong only to {workspace.name} and will not appear in other
          workspaces.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleCreateDmn}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveOutlinedIcon />}
          >
            {isLoading ? 'Creating...' : 'Create DMN'}
          </Button>
        </Box>
      </Paper>
    </Stack>
  )
}

export default DmnNewPage