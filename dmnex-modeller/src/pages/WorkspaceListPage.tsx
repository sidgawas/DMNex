import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const
const SORT_BY_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'updatedAt', label: 'Updated At' },
  { value: 'createdAt', label: 'Created At' },
  { value: 'slug', label: 'Slug' },
  { value: 'id', label: 'ID' },
] as const
const SORT_ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const

type SortByOption = (typeof SORT_BY_OPTIONS)[number]['value']
type SortOrderOption = (typeof SORT_ORDER_OPTIONS)[number]['value']

const DEFAULT_SORT_BY: SortByOption = 'name'
const DEFAULT_SORT_ORDER: SortOrderOption = 'asc'

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function WorkspaceListPage() {
  const {
    workspaces,
    workspacesTotalItems,
    workspacesTotalPages,
    isWorkspacesLoading,
    workspacesError,
    refreshWorkspaces,
    updateWorkspaceName,
    deleteWorkspace,
  } = useWorkspaceStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const [workspacePendingEdit, setWorkspacePendingEdit] = useState<{ id: string; name: string } | null>(null)
  const [workspaceEditName, setWorkspaceEditName] = useState('')
  const [workspaceEditError, setWorkspaceEditError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [workspacePendingDelete, setWorkspacePendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const requestedPage = parsePositiveInt(searchParams.get('page'), 1)
  const requestedSize = parsePositiveInt(searchParams.get('size'), 10)
  const requestedQuery = searchParams.get('query')
  const requestedSortBy = searchParams.get('sortBy')
  const requestedSortOrder = searchParams.get('sortOrder')
  const normalizedSize = PAGE_SIZE_OPTIONS.includes(requestedSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedSize
    : 10
  const normalizedQuery = requestedQuery?.trim() || ''
  const normalizedSortBy = SORT_BY_OPTIONS.some((option) => option.value === requestedSortBy)
    ? requestedSortBy
    : DEFAULT_SORT_BY
  const normalizedSortOrder = SORT_ORDER_OPTIONS.some((option) => option.value === requestedSortOrder)
    ? requestedSortOrder
    : DEFAULT_SORT_ORDER
  const getSearchParamsState = (
    page: number,
    size: number,
    sortBy: SortByOption,
    sortOrder: SortOrderOption,
    query: string,
  ) => {
    const nextParams: Record<string, string> = {
      page: String(page),
      size: String(size),
      sortBy,
      sortOrder,
    }

    if (query) {
      nextParams.query = query
    }

    return nextParams
  }

  const isQueryNormalized =
    searchParams.get('page') === String(requestedPage) &&
    searchParams.get('size') === String(normalizedSize) &&
    searchParams.get('sortBy') === normalizedSortBy &&
    searchParams.get('sortOrder') === normalizedSortOrder &&
    searchParams.get('query') === (normalizedQuery || null)

  useEffect(() => {
    if (!isQueryNormalized) {
      setSearchParams(
        getSearchParamsState(requestedPage, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery),
        { replace: true },
      )
      return
    }

    void refreshWorkspaces(requestedPage - 1, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery)
  }, [
    isQueryNormalized,
    normalizedQuery,
    normalizedSize,
    normalizedSortBy,
    normalizedSortOrder,
    refreshWorkspaces,
    requestedPage,
    setSearchParams,
  ])

  const pageLabel = workspacesTotalItems === 0
    ? `Page ${requestedPage} • 0 results`
    : `Showing page ${requestedPage} of ${Math.max(workspacesTotalPages, 1)} (${workspacesTotalItems} total)`

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const nextSize = Number(event.target.value)
    setSearchParams(getSearchParamsState(1, nextSize, normalizedSortBy, normalizedSortOrder, normalizedQuery))
  }

  const handlePageChange = (_: ChangeEvent<unknown>, nextPage: number) => {
    setSearchParams(getSearchParamsState(nextPage, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery))
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = (formData.get('query')?.toString() ?? '').trim()
    setSearchParams(getSearchParamsState(1, normalizedSize, normalizedSortBy, normalizedSortOrder, query))
  }

  const handleClearSearch = () => {
    setSearchParams(getSearchParamsState(1, normalizedSize, normalizedSortBy, normalizedSortOrder, ''))
  }

  const handleSortByChange = (event: SelectChangeEvent<SortByOption>) => {
    const nextSortBy = event.target.value as SortByOption
    setSearchParams(getSearchParamsState(1, normalizedSize, nextSortBy, normalizedSortOrder, normalizedQuery))
  }

  const handleSortOrderChange = (event: SelectChangeEvent<SortOrderOption>) => {
    const nextSortOrder = event.target.value as SortOrderOption
    setSearchParams(getSearchParamsState(1, normalizedSize, normalizedSortBy, nextSortOrder, normalizedQuery))
  }

  const handleStartEditWorkspace = (workspaceId: string, workspaceName: string) => {
    setWorkspacePendingEdit({ id: workspaceId, name: workspaceName })
    setWorkspaceEditName(workspaceName)
    setWorkspaceEditError(null)
  }

  const handleSaveWorkspaceName = async () => {
    if (!workspacePendingEdit) {
      return
    }

    const trimmedName = workspaceEditName.trim()

    if (!trimmedName) {
      setWorkspaceEditError('Workspace name is required.')
      return
    }

    setWorkspaceEditError(null)
    setIsUpdating(true)

    try {
      await updateWorkspaceName(workspacePendingEdit.id, trimmedName)
      setWorkspacePendingEdit(null)
      setWorkspaceEditName('')
      void refreshWorkspaces(requestedPage - 1, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery)
    } catch {
      setWorkspaceEditError('Failed to update workspace name. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspacePendingDelete) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteWorkspace(workspacePendingDelete.id)

      const isLastItemInPage = workspaces.length === 1
      const nextPage = isLastItemInPage && requestedPage > 1 ? requestedPage - 1 : requestedPage
      setWorkspacePendingDelete(null)

      if (nextPage !== requestedPage) {
        setSearchParams(getSearchParamsState(nextPage, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery))
        return
      }

      void refreshWorkspaces(requestedPage - 1, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery)
    } catch {
      // Store-level error state is surfaced in the page alert via workspacesError.
    } finally {
      setIsDeleting(false)
    }
  }

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

      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        variant="outlined"
        sx={{
          p: 1,
          borderRadius: 2,
        }}
      >
        <TextField
          key={normalizedQuery}
          name="query"
          fullWidth
          size="small"
          label="Search by workspace name"
          placeholder="Type a workspace name"
          defaultValue={normalizedQuery}
          disabled={isWorkspacesLoading}
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {normalizedQuery.length > 0 ? (
                    <IconButton
                      aria-label="Clear search"
                      size="small"
                      onClick={handleClearSearch}
                      disabled={isWorkspacesLoading}
                      type="button"
                    >
                      <ClearOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  <IconButton
                    aria-label="Search workspaces"
                    size="small"
                    type="submit"
                    color="primary"
                    disabled={isWorkspacesLoading}
                  >
                    <SearchOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {workspacesError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                void refreshWorkspaces(requestedPage - 1, normalizedSize, normalizedSortBy, normalizedSortOrder, normalizedQuery)
              }
            >
              Retry
            </Button>
          }
        >
          {workspacesError}
        </Alert>
      ) : null}

      {isWorkspacesLoading ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading workspaces...</Typography>
        </Paper>
      ) : workspaces.length === 0 ? (
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
              return (
                <ListItem
                  key={workspace.id}
                  disablePadding
                  divider={index !== workspaces.length - 1}
                >
                  <ListItemButton component={RouterLink} to={`/workspaces/${workspace.id}/dmns`}>
                    <ListItemText
                      primary={workspace.name}
                      secondary={workspace.slug}
                    />
                  </ListItemButton>
                  <Tooltip title="Edit workspace name">
                    <IconButton
                      edge="end"
                      aria-label={`Edit workspace ${workspace.name}`}
                      color="primary"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleStartEditWorkspace(workspace.id, workspace.name)
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete workspace">
                    <IconButton
                      edge="end"
                      aria-label={`Delete workspace ${workspace.name}`}
                      color="error"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setWorkspacePendingDelete({ id: workspace.id, name: workspace.name })
                      }}
                      sx={{ mr: 1 }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItem>
              )
            })}
          </List>

          <Box
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.25,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {pageLabel}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Rows per page
              </Typography>
              <FormControl size="small" sx={{ minWidth: 84 }}>
                <Select<number>
                  value={normalizedSize}
                  onChange={handlePageSizeChange}
                  disabled={isWorkspacesLoading}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Sort by
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select<SortByOption>
                  value={normalizedSortBy}
                  onChange={handleSortByChange}
                  disabled={isWorkspacesLoading}
                >
                  {SORT_BY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Order
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select<SortOrderOption>
                  value={normalizedSortOrder}
                  onChange={handleSortOrderChange}
                  disabled={isWorkspacesLoading}
                >
                  {SORT_ORDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Pagination
                page={requestedPage}
                count={Math.max(workspacesTotalPages, 1)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                onChange={handlePageChange}
              />
            </Box>
          </Box>
        </Paper>
      )}

      <Dialog
        open={workspacePendingEdit !== null}
        onClose={() => {
          if (!isUpdating) {
            setWorkspacePendingEdit(null)
            setWorkspaceEditName('')
            setWorkspaceEditError(null)
          }
        }}
      >
        <DialogTitle>Edit Workspace Name</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Workspace Name"
            value={workspaceEditName}
            onChange={(event) => setWorkspaceEditName(event.target.value)}
            disabled={isUpdating}
            error={workspaceEditError !== null}
            helperText={workspaceEditError ?? ' '}
            sx={{ mt: 0.5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setWorkspacePendingEdit(null)
              setWorkspaceEditName('')
              setWorkspaceEditError(null)
            }}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveWorkspaceName()}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={workspacePendingDelete !== null}
        onClose={() => {
          if (!isDeleting) {
            setWorkspacePendingDelete(null)
          }
        }}
      >
        <DialogTitle>Delete Workspace</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {workspacePendingDelete
              ? `Are you sure you want to delete "${workspacePendingDelete.name}"?`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkspacePendingDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void handleDeleteWorkspace()} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default WorkspaceListPage