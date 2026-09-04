import { useEffect, useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Description,
  Person,
  School,
  Category,
  CalendarToday,
  FileDownload,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import type { Report } from '../types'
import { exportReportToPdf } from '../utils/reportPdfExport'

interface PublicReportDetailPageProps {
  reportId: number
  onBack: () => void
}

export default function PublicReportDetailPage({ reportId, onBack }: PublicReportDetailPageProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportError, setExportError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    fetchReportDetail()
  }, [reportId])

  const fetchReportDetail = async () => {
    setLoading(true)
    setError('')

    try {
      const reportData = await apiFetch<Report>(API_ROUTES.reports.publicById(reportId))
      setReport(reportData)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Report not found.')
          return
        }
        setError(err.message)
      } else {
        setError('Failed to load report details. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExportPdf = async () => {
    if (!report) {
      return
    }

    setExportError('')
    setExportingPdf(true)

    try {
      await exportReportToPdf(report)
    } catch {
      setExportError('Failed to export PDF. Please try again.')
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        </Box>

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchReportDetail}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {!error && exportError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {exportError}
          </Alert>
        )}

        {!error && report && (
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description color="primary" />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                  Report Details
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                <Chip icon={<School />} label={`Grade ${report.grade}`} variant="outlined" />
                <Chip
                  icon={<Category />}
                  label={report.reportType}
                  color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                />
                <Chip icon={<Person />} label={`Author: ${report.authorUsername}`} />
                <Chip
                  icon={<CalendarToday />}
                  label={`Created: ${formatDate(report.createdAt)}`}
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={handleExportPdf}
                disabled={exportingPdf}
                sx={{ textTransform: 'none', mb: 3 }}
              >
                {exportingPdf ? 'Exporting PDF...' : 'Export PDF'}
              </Button>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Student
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {report.student}
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Report Content
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  color: 'text.primary',
                }}
              >
                {report.content || 'No content provided.'}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  )
}

