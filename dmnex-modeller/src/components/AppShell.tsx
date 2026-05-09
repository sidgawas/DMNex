import { useMemo, useState, type ReactNode } from 'react'
import AddIcon from '@mui/icons-material/Add'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import { Link as RouterLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

const expandedDrawerWidth = 280
const collapsedDrawerWidth = 84

type NavigationItem = {
  label: string
  to: string
  icon: ReactNode
  isSelected: (pathname: string) => boolean
}

function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { getWorkspace } = useWorkspaceStore()

  const drawerWidth = isCollapsed ? collapsedDrawerWidth : expandedDrawerWidth
  const activeWorkspace = workspaceId ? getWorkspace(workspaceId) : undefined

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const baseItems: NavigationItem[] = [
      {
        label: 'Workspaces',
        to: '/workspaces',
        icon: <WorkspacesOutlinedIcon />,
        isSelected: (pathname) => pathname === '/workspaces' || pathname.startsWith('/workspaces/'),
      },
      {
        label: 'New Workspace',
        to: '/workspaces/new',
        icon: <AddBusinessOutlinedIcon />,
        isSelected: (pathname) => pathname === '/workspaces/new',
      },
    ]

    if (!workspaceId) {
      return baseItems
    }

    return [
      ...baseItems,
      {
        label: 'DMN Library',
        to: `/workspaces/${workspaceId}/dmns`,
        icon: <DescriptionOutlinedIcon />,
        isSelected: (pathname) =>
          pathname === `/workspaces/${workspaceId}/dmns` ||
          pathname.startsWith(`/workspaces/${workspaceId}/dmns/`),
      },
      {
        label: 'Create DMN',
        to: `/workspaces/${workspaceId}/dmns/new`,
        icon: <AddIcon />,
        isSelected: (pathname) => pathname === `/workspaces/${workspaceId}/dmns/new`,
      },
    ]
  }, [workspaceId])

  const activePath = location.pathname

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background:
          'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.14), transparent 28%), radial-gradient(circle at 90% 100%, rgba(14, 165, 233, 0.18), transparent 32%), #f8fafc',
      }}
    >
      <Drawer
        variant="persistent"
        open
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              overflowX: 'hidden',
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 240ms ease-in-out',
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(240, 249, 255, 0.96) 55%, rgba(236, 253, 245, 0.9) 100%)',
            },
          },
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 240ms ease-in-out',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
      >
        <Box
          sx={{
            px: isCollapsed ? 1 : 2,
            py: 1.5,
            minHeight: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: 1,
          }}
        >
          {isCollapsed ? null : (
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
            >
              DMNex
            </Typography>
          )}

          <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setIsCollapsed((previous) => !previous)}
              size="small"
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        {activeWorkspace ? (
          <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 0.75 }}>
            {isCollapsed ? null : (
              <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                Active Workspace
              </Typography>
            )}
            {isCollapsed ? (
              <Tooltip title={activeWorkspace.name} placement="right">
                <Chip size="small" color="primary" label="WS" sx={{ borderRadius: 1.5 }} />
              </Tooltip>
            ) : (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={activeWorkspace.name}
                sx={{ width: '100%', justifyContent: 'flex-start', borderRadius: 1.5 }}
              />
            )}
          </Box>
        ) : null}

        <Divider />

        <List sx={{ px: 1.25, py: 1.5, display: 'grid', gap: 0.5 }}>
          {navigationItems.map((item) => {
            const isSelected = item.isSelected(activePath)

            return (
              <Tooltip
                key={item.to}
                title={isCollapsed ? item.label : ''}
                placement="right"
              >
                <ListItemButton
                  component={RouterLink}
                  to={item.to}
                  selected={isSelected}
                  sx={{
                    minHeight: 46,
                    px: 1,
                    borderRadius: 2,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isCollapsed ? 0 : 1.5,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {isCollapsed ? null : (
                    <Typography sx={{ fontSize: 14, fontWeight: isSelected ? 700 : 500 }}>
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>

        <Box sx={{ mt: 'auto', px: 1.5, pb: 1.5 }}>
          <Tooltip title={isCollapsed ? 'Toggle navigation' : ''}>
            <IconButton
              aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              onClick={() => setIsCollapsed((previous) => !previous)}
              sx={{ width: '100%' }}
            >
              <MenuOpenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          transition: (theme) =>
            theme.transitions.create(['padding'], {
              duration: theme.transitions.duration.shortest,
              easing: theme.transitions.easing.easeInOut,
            }),
        }}
      >
        <Paper
          elevation={0}
          sx={{
            minHeight: 'calc(100vh - 48px)',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            p: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  )
}

export default AppShell