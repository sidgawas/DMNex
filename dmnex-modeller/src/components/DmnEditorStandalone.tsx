import { useEffect, useRef, useState } from 'react'
import SaveIcon from '@mui/icons-material/Save'
import { Alert, Box, Button, Chip, Container, Paper, Typography } from '@mui/material'
import * as DmnEditorStandalone from '@kie-tools/dmn-editor-standalone/dist'

type DmnEditorInstance = {
  close: () => void
  getContent: () => Promise<string>
  markAsSaved: () => void
  subscribeToContentChanges: (callback: (isDirty: boolean) => void) => void
  unsubscribeToContentChanges: (callback: (isDirty: boolean) => void) => void
}

type DmnEditorStandaloneProps = {
  initialXml: string
  filePath?: string
  readOnly?: boolean
  onSave: (xml: string) => void | Promise<void>
}

function DmnEditorStandaloneComponent({
  initialXml,
  filePath = 'model.dmn',
  readOnly = false,
  onSave,
}: DmnEditorStandaloneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<DmnEditorInstance | null>(null)
  const contentChangeCallbackRef = useRef<((isDirty: boolean) => void) | null>(null)
  const bootstrappedXmlRef = useRef(initialXml)

  const [isReady, setIsReady] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let isDisposed = false

    try {
      const editor = DmnEditorStandalone.open({
        container,
        initialContent: Promise.resolve(bootstrappedXmlRef.current),
        initialFileNormalizedPosixPathRelativeToTheWorkspaceRoot: filePath,
        readOnly,
        onError: () => {
          if (!isDisposed) {
            setErrorMessage('The DMN editor reported an internal error.')
          }
        },
      }) as DmnEditorInstance

      const onContentChange = (dirty: boolean) => {
        if (!isDisposed) {
          setIsDirty(dirty)
        }
      }

      editor.subscribeToContentChanges(onContentChange)

      editorRef.current = editor
      contentChangeCallbackRef.current = onContentChange
      window.setTimeout(() => {
        if (!isDisposed) {
          setIsReady(true)
        }
      }, 0)
    } catch (error) {
      window.setTimeout(() => {
        if (!isDisposed) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to initialize DMN editor.',
          )
        }
      }, 0)
    }

    return () => {
      isDisposed = true

      if (editorRef.current && contentChangeCallbackRef.current) {
        editorRef.current.unsubscribeToContentChanges(contentChangeCallbackRef.current)
      }

      editorRef.current?.close()
      editorRef.current = null
      contentChangeCallbackRef.current = null
    }
  }, [filePath, readOnly])

  const handleSave = async () => {
    if (!editorRef.current || isSaving) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)
      const xml = await editorRef.current.getContent()
      await onSave(xml)
      editorRef.current.markAsSaved()
      setIsDirty(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Paper
      component="section"
      aria-label="DMN editor workspace"
      elevation={0}
      sx={{
        display: 'grid',
        minWidth: '100%',
        gridTemplateRows: errorMessage ? 'auto auto 1fr' : 'auto 1fr',
        minHeight: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(120deg, rgba(219, 234, 254, 0.8) 0%, rgba(240, 249, 255, 0.85) 45%, rgba(220, 252, 231, 0.75) 100%)',
        }}
      >
        <Box
          role="status"
          aria-live="polite"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
        >
          <Chip
            size="small"
            color={isDirty ? 'warning' : 'success'}
            label={isDirty ? 'Unsaved' : 'Saved'}
            variant={isDirty ? 'filled' : 'outlined'}
          />
          <Typography variant="body2" color="text.secondary">
            {isDirty ? 'Changes are waiting to be saved' : 'All changes are saved'}
          </Typography>
        </Box>
        <Button
          type="button"
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={!isReady || isSaving || readOnly}
          onClick={handleSave}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {isSaving ? 'Saving...' : 'Save XML'}
        </Button>
      </Box>

      {errorMessage ? (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {errorMessage}
        </Alert>
      ) : null}

      <Container ref={containerRef} sx={{ minHeight: '100%', minWidth: '100%' }} />
    </Paper>
  )
}

export default DmnEditorStandaloneComponent
