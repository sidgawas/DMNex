import { useState } from 'react'
import { Box, Container, Paper, Typography } from '@mui/material'
import DmnEditorStandalone from './components/DmnEditorStandalone'

function App() {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [savedSize, setSavedSize] = useState<number | null>(null)

  const handleSave = (xml: string) => {
    setLastSavedAt(new Date().toLocaleTimeString())
    setSavedSize(xml.length)
    console.info('Saved DMN XML', xml)
  }

  return (
    <Box
      id="app-root"
      sx={{
        py: { xs: 2, md: 4 },
        minHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at 5% 5%, rgba(56, 189, 248, 0.18), transparent 30%), radial-gradient(circle at 90% 0%, rgba(34, 197, 94, 0.16), transparent 30%), #f7fafc',
      }}
    >
      <Container
        id="app-container"
        maxWidth="xl"
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'auto 1fr',
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 249, 255, 0.92) 100%)',
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography
              variant="h4"
              color="text.primary"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              DMNex Modeller
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Edit DMN files in a standalone embedded editor.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastSavedAt
                ? `Last save at ${lastSavedAt} (${savedSize ?? 0} chars)`
                : 'No saves yet'}
            </Typography>
          </Box>
        </Paper>

        <DmnEditorStandalone
          initialXml=""
          filePath="models/decision.dmn"
          onSave={handleSave}
        />
      </Container>
    </Box>
  )
}

export default App
