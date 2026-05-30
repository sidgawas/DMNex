import { useEffect } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRenderCellParams,
  type GridSortModel,
} from '@mui/x-data-grid'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { useWorkspaceStore } from '../features/workspace/useWorkspaceStore'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const SORTABLE_FIELDS = ['title', 'createdAt', 'updatedAt'] as const

type DmnSortField = (typeof SORTABLE_FIELDS)[number]
type DmnSortOrder = 'asc' | 'desc'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT_BY: DmnSortField = 'updatedAt'
const DEFAULT_SORT_ORDER: DmnSortOrder = 'desc'

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const isSortableField = (value: string | null): value is DmnSortField =>
  SORTABLE_FIELDS.some((field) => field === value)

const getSearchParamsState = (
  page: number,
  size: number,
  sortBy: DmnSortField,
  sortOrder: DmnSortOrder,
  query: string,
) => {
  const nextParams = new URLSearchParams()

  nextParams.set('page', String(page))
  nextParams.set('size', String(size))
  nextParams.set('sortBy', sortBy)
  nextParams.set('sortOrder', sortOrder)

  if (query) {
    nextParams.set('query', query)
  } else {
    nextParams.delete('query')
  }

  return nextParams
}

const getQueryFromFilterModel = (filterModel: GridFilterModel) => {
  const quickFilterQuery = filterModel.quickFilterValues
    ?.map((value) => String(value).trim())
    .filter(Boolean)
    .join(' ')

  if (quickFilterQuery) {
    return quickFilterQuery
  }

  const titleFilter = filterModel.items.find((item) => item.field === 'title')
  return String(titleFilter?.value ?? '').trim()
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function DmnListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    getWorkspace,
    listDmns,
    dmnsTotalItems,
    refreshDmns,
    isDmnsLoading,
    dmnsError,
  } = useWorkspaceStore()

  const requestedPage = parsePositiveInt(searchParams.get('page'), 1)
  const requestedSize = parsePositiveInt(searchParams.get('size'), DEFAULT_PAGE_SIZE)
  const requestedSortBy = searchParams.get('sortBy')
  const requestedSortOrder = searchParams.get('sortOrder')
  const requestedQuery = searchParams.get('query')
  const normalizedSize = PAGE_SIZE_OPTIONS.includes(requestedSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedSize
    : DEFAULT_PAGE_SIZE
  const normalizedSortBy = isSortableField(requestedSortBy) ? requestedSortBy : DEFAULT_SORT_BY
  const normalizedSortOrder = requestedSortOrder === 'asc' || requestedSortOrder === 'desc'
    ? requestedSortOrder
    : DEFAULT_SORT_ORDER
  const normalizedQuery = requestedQuery?.trim() || ''
  const isQueryNormalized =
    searchParams.get('page') === String(requestedPage) &&
    searchParams.get('size') === String(normalizedSize) &&
    searchParams.get('sortBy') === normalizedSortBy &&
    searchParams.get('sortOrder') === normalizedSortOrder &&
    searchParams.get('query') === (normalizedQuery || null)

  useEffect(() => {
    if (!workspaceId) {
      return
    }

    if (!isQueryNormalized) {
      setSearchParams(
        getSearchParamsState(
          requestedPage,
          normalizedSize,
          normalizedSortBy,
          normalizedSortOrder,
          normalizedQuery,
        ),
        { replace: true },
      )
      return
    }

    void refreshDmns(
      workspaceId,
      requestedPage - 1,
      normalizedSize,
      normalizedSortBy,
      normalizedSortOrder,
      normalizedQuery,
    )
  }, [
    isQueryNormalized,
    normalizedQuery,
    normalizedSize,
    normalizedSortBy,
    normalizedSortOrder,
    refreshDmns,
    requestedPage,
    setSearchParams,
    workspaceId,
  ])

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

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    const nextPageSize = model.pageSize
    const nextPage = nextPageSize === normalizedSize ? model.page + 1 : 1

    if (nextPage === requestedPage && nextPageSize === normalizedSize) {
      return
    }

    setSearchParams(
      getSearchParamsState(nextPage, nextPageSize, normalizedSortBy, normalizedSortOrder, normalizedQuery),
    )
  }

  const handleSortModelChange = (model: GridSortModel) => {
    const nextSort = model[0]
    const nextSortBy = isSortableField(nextSort?.field) ? nextSort.field : DEFAULT_SORT_BY
    const nextSortOrder = nextSort?.sort === 'asc' || nextSort?.sort === 'desc'
      ? nextSort.sort
      : DEFAULT_SORT_ORDER

    if (nextSortBy === normalizedSortBy && nextSortOrder === normalizedSortOrder) {
      return
    }

    setSearchParams(getSearchParamsState(1, normalizedSize, nextSortBy, nextSortOrder, normalizedQuery))
  }

  const handleFilterModelChange = (filterModel: GridFilterModel) => {
    const nextQuery = getQueryFromFilterModel(filterModel)

    if (nextQuery === normalizedQuery) {
      return
    }

    setSearchParams(getSearchParamsState(1, normalizedSize, normalizedSortBy, normalizedSortOrder, nextQuery))
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filterable: true,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      sortable: false,
      filterable: false,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      sortable: false,
      align: 'center',
      filterable: false,
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.publishedVersionNumber ? 'Published' : 'Draft'}
          size="small"
          color={params.row.publishedVersionNumber ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      align: 'right',
      headerAlign: 'right',
      filterable: false,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value as string),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 180,
      align: 'right',
      filterable: false,
      headerAlign: 'right',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value as string),
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 120,
      align: 'left',
      filterable: false,
      headerAlign: 'left',
      sortable: false,
    },
    {
      field: 'updatedBy',
      headerName: 'Updated By',
      width: 120,
      align: 'left',
      filterable: false,
      headerAlign: 'left',
      sortable: false,
    },
    {
      field: 'lastPublishedAt',
      headerName: 'Published',
      width: 180,
      align: 'right',
      filterable: false,
      headerAlign: 'right',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value as string | null),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      headerAlign: 'center',
      filterable: false,
      sortable: false,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          component={RouterLink}
          to={`/workspaces/${workspaceId}/dmns/${params.row.id}/edit`}
          variant="outlined"
          startIcon={<EditOutlinedIcon fontSize="small" />}
        >
          Edit DMN
        </Button>
      ),
    },
  ]

  return (
    <Stack
      spacing={2.5}
      id="dmn-list-page"
      sx={{
        height: '100%',
        minHeight: 0,
        flex: 1,
      }}
    >
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

      {dmnsError && <Alert severity="error">{dmnsError}</Alert>}

      {!isDmnsLoading && dmns.length === 0 ? (
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
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
            display: 'flex',
          }}
        >
          <DataGrid
            rows={dmns}
            columns={columns}
            loading={isDmnsLoading}
            pagination
            paginationMode="server"
            sortingMode="server"
            filterMode="server"
            rowCount={dmnsTotalItems}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            paginationModel={{ page: requestedPage - 1, pageSize: normalizedSize }}
            onPaginationModelChange={handlePaginationModelChange}
            sortModel={[{ field: normalizedSortBy, sort: normalizedSortOrder }]}
            onSortModelChange={handleSortModelChange}
            initialState={{
              filter: {
                filterModel: {
                  items: normalizedQuery
                    ? [{ id: 1, field: 'title', operator: 'contains', value: normalizedQuery }]
                    : [],
                  quickFilterValues: normalizedQuery ? [normalizedQuery] : [],
                },
              },
            }}
            onFilterModelChange={handleFilterModelChange}
            filterDebounceMs={1000}
            showToolbar
            disableRowSelectionOnClick
            density="comfortable"
            sx={{
              border: 'none',
              flex: 1,
              minHeight: 0,
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: {
                  debounceMs: 400,
                },
              },
            }}
          />
        </Paper>
      )}
    </Stack>
  )
}

export default DmnListPage