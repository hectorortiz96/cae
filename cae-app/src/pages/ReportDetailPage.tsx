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
  Logout,
  Link as LinkIcon,
  Description,
  Person,
  School,
  Category,
  CalendarToday,
  FileDownload,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import { copyPublicReportLink } from '../utils/publicReportLink'
import type { Report } from '../types'
import { exportReportToPdf } from '../utils/reportPdfExport'

interface ReportDetailPageProps {
  reportId: number
  onBack: () => void
  onLogout: () => void
}

export default function ReportDetailPage({ reportId, onBack, onLogout }: ReportDetailPageProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [shareError, setShareError] = useState('')
  const [exportError, setExportError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    fetchReportDetail()
  }, [reportId])

  const fetchReportDetail = async () => {
    setLoading(true)
    setError('')

    try {
      const reportData = await apiFetch<Report>(API_ROUTES.reports.byId(reportId), {
        headers: getAuthHeader(),
      })
      setReport(reportData)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Session expired. Please log in again.')
          handleLogout()
          return
        }
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

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleCopyPublicLink = async () => {
    setShareMessage('')
    setShareError('')

    try {
      await copyPublicReportLink(reportId)
      setShareMessage('Public link copied to clipboard.')
    } catch {
      setShareError('Failed to copy public link. Please copy it from the browser address bar.')
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
      await exportReportToPdf(report, {
        title: `Report Details #${report.id}`,
      })
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ textTransform: 'none' }}>
            Back to Dashboard
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={handleCopyPublicLink}
              sx={{ textTransform: 'none' }}
            >
              Copy Public Link
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExportPdf}
              disabled={!report || exportingPdf}
              sx={{ textTransform: 'none' }}
            >
              {exportingPdf ? 'Exporting PDF...' : 'Export PDF'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {shareMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {shareMessage}
          </Alert>
        )}

        {shareError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {shareError}
          </Alert>
        )}

        {exportError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {exportError}
          </Alert>
        )}

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
                <Chip icon={<Category />} label={report.reportType} color={report.reportType === 'Reporte' ? 'error' : 'warning'} />
                <Chip icon={<Person />} label={`Author: ${report.authorUsername}`} />
                <Chip
                  icon={<CalendarToday />}
                  label={`Created: ${formatDate(report.createdAt)}`}
                  variant="outlined"
                />
              </Box>


              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Student Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {report.studentName}
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

