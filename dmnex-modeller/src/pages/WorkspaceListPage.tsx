import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import {
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
import { Link as RouterLink } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

function WorkspaceListPage() {
  const { workspaces, listDmns } = useWorkspaceStore()

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
            Workspaces
          </Typography>
          <Typography color="text.secondary">
            Create isolated spaces for DMN definitions.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/workspaces/new"
          variant="contained"
          startIcon={<AddOutlinedIcon />}
        >
          New Workspace
        </Button>
      </Box>

      {workspaces.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            display: 'grid',
            gap: 1,
            justifyItems: 'flex-start',
          }}
        >
          <Chip icon={<WorkspacesOutlinedIcon />} label="Workspace Placeholder" size="small" />
          <Typography variant="h6" sx={{ fontWeight: 650 }}>
            No workspaces yet
          </Typography>
          <Typography color="text.secondary">
            Start by creating a workspace. Every DMN you create later will be isolated inside that
            workspace.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {workspaces.map((workspace, index) => {
              const dmnCount = listDmns(workspace.id).length

              return (
                <ListItemButton
                  key={workspace.id}
                  component={RouterLink}
                  to={`/workspaces/${workspace.id}/dmns`}
                  divider={index !== workspaces.length - 1}
                >
                  <ListItemText
                    primary={workspace.name}
                    secondary={`${dmnCount} DMN${dmnCount === 1 ? '' : 's'}`}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Paper>
      )}
    </Stack>
  )
}

export default WorkspaceListPage