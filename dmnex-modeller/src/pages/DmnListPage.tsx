import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function DmnListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { getWorkspace, listDmns } = useWorkspaceStore()

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

  const dmns = listDmns(workspaceId)

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 750, letterSpacing: '-0.02em' }}>
            DMN Library - {workspace.name}
          </Typography>
          <Typography color="text.secondary">
            DMN definitions isolated to this workspace.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={`/workspaces/${workspaceId}/dmns/new`}
          variant="contained"
          startIcon={<AddOutlinedIcon />}
        >
          New DMN
        </Button>
      </Box>

      {dmns.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            display: 'grid',
            gap: 1.5,
            justifyItems: 'flex-start',
          }}
        >
          <Chip size="small" icon={<DescriptionOutlinedIcon />} label="Empty Workspace" />
          <Typography variant="h6" sx={{ fontWeight: 650 }}>
            No DMNs in this workspace
          </Typography>
          <Typography color="text.secondary">
            Create your first DMN to start modelling decisions in this isolated workspace.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {dmns.map((dmn, index) => (
              <ListItemButton
                key={dmn.id}
                component={RouterLink}
                to={`/workspaces/${workspaceId}/dmns/${dmn.id}/edit`}
                divider={index !== dmns.length - 1}
              >
                <ListItemText
                  primary={dmn.title}
                  secondary={`v${dmn.version} - ${dmn.filePath}`}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  )
}

export default DmnListPage