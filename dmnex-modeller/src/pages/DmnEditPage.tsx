import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import DmnEditorStandaloneComponent from '../components/DmnEditorStandalone'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function DmnEditPage() {
  const { workspaceId, dmnId } = useParams<{ workspaceId: string; dmnId: string }>()
  const { getWorkspace, getDmn, updateDmn } = useWorkspaceStore()

  const workspace = workspaceId ? getWorkspace(workspaceId) : undefined
  const dmn = workspaceId && dmnId ? getDmn(workspaceId, dmnId) : undefined

  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const dmnDescription = useMemo(() => dmn?.description ?? '', [dmn?.description])

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

  const handleSaveXml = async (xml: string) => {
    setError(null)
    setIsSaving(true)

    try {
      await updateDmn(workspaceId, dmnId, dmn.title, xml, dmnDescription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update DMN. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
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
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Back to list
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {isSaving && <Alert severity="info">Saving DMN XML...</Alert>}

      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Container sx={{ flex: 1, minHeight: 0, display: 'flex', minWidth: '100%' }}>
          <DmnEditorStandaloneComponent
            initialXml={dmn.xml}
            filePath={`${dmn.title || 'model'}.dmn`}
            onSave={handleSaveXml}
          />
        </Container>
{/* 
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography color="text.secondary">DMN Metadata:</Typography>
          <Chip
            icon={<EditNoteOutlinedIcon />}
            color="primary"
            variant="outlined"
            label={`DMN ID: ${dmn.id}`}
            sx={{ width: 'fit-content' }}
          />
          <Typography color="text.secondary" variant="body2">
            Created: {new Date(dmn.createdAt).toLocaleString()}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Updated: {new Date(dmn.updatedAt).toLocaleString()}
          </Typography>
          {dmn.lastPublishedAt && (
            <Typography color="text.secondary" variant="body2">
              Last Published: {new Date(dmn.lastPublishedAt).toLocaleString()}
            </Typography>
          )}
        </Box> */}
      </Stack>
    </Stack>
  )
}

export default DmnEditPage