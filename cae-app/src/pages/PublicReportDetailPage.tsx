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
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  ArrowBack,
  Description,
  DescriptionOutlined,
  Person,
  School,
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
  const [receivedChecked, setReceivedChecked] = useState(false)
  const [confirmingReceived, setConfirmingReceived] = useState(false)
  const [receivedError, setReceivedError] = useState('')

  useEffect(() => {
    fetchReportDetail()
  }, [reportId])

  const fetchReportDetail = async () => {
    setLoading(true)
    setError('')
    setReceivedError('')

    try {
      const reportData = await apiFetch<Report>(API_ROUTES.reports.publicById(reportId))
      setReport(reportData)
      setReceivedChecked(reportData.received)
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

  const handleConfirmReceived = async () => {
    if (!report || report.received || !receivedChecked) {
      return
    }

    setReceivedError('')
    setConfirmingReceived(true)

    try {
      const updatedReport = await apiFetch<Report>(API_ROUTES.reports.publicMarkReceived(report.id), {
        method: 'PUT',
      })
      setReport(updatedReport)
      setReceivedChecked(updatedReport.received)
    } catch (err) {
      if (err instanceof ApiError) {
        setReceivedError(err.message)
      } else {
        setReceivedError('Failed to confirm report receipt. Please try again.')
      }
    } finally {
      setConfirmingReceived(false)
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
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}>
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

        {!error && receivedError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {receivedError}
          </Alert>
        )}

        {!error && report && (
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description color="primary" />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                  Report Details
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                <Chip icon={<School />} label={`Grade ${report.grade}`} variant="outlined" />
                <Chip
                  icon={<DescriptionOutlined />}
                  label={report.reportType}
                  color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                />
                <Chip icon={<Person />} label={`Author: ${report.authorFullName}`} />
                <Chip
                  icon={<CalendarToday />}
                  label={`Created: ${formatDate(report.createdAt)}`}
                  variant="outlined"
                />
                <Chip
                  label={report.received ? 'Acknowledged as received' : 'Pending acknowledgment'}
                  color={report.received ? 'success' : 'default'}
                  variant={report.received ? 'filled' : 'outlined'}
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={receivedChecked}
                    onChange={(event) => setReceivedChecked(event.target.checked)}
                    disabled={report.received || confirmingReceived}
                  />
                }
                label="I acknowledge that this report was received"
                sx={{ mb: 1 }}
              />

              <Button
                variant="contained"
                onClick={handleConfirmReceived}
                disabled={report.received || !receivedChecked || confirmingReceived}
                sx={{ textTransform: 'none', mb: 3, width: { xs: '100%', sm: 'auto' } }}
              >
                {report.received ? 'Receipt Confirmed' : confirmingReceived ? 'Confirming...' : 'Confirm Receipt'}
              </Button>

              <Divider sx={{ mb: 3 }} />

              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={handleExportPdf}
                disabled={exportingPdf}
                sx={{ textTransform: 'none', mb: 3, width: { xs: '100%', sm: 'auto' } }}
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
