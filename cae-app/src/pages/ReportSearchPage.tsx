import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  ArrowBack,
  Description,
  Link as LinkIcon,
  Logout,
  Visibility,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import { copyPublicReportLink } from '../utils/publicReportLink'
import type { Report } from '../types'

interface ReportSearchPageProps {
  onBack: () => void
  onLogout: () => void
  onViewReport: (reportId: number) => void
}

export default function ReportSearchPage({ onBack, onLogout, onViewReport }: ReportSearchPageProps) {
  const [studentName, setStudentName] = useState('')
  const [searchedName, setSearchedName] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [shareError, setShareError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const latestRequestRef = useRef(0)
  const searchTimeoutRef = useRef<number | null>(null)

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const runSearch = async (normalizedStudentName: string, requestId: number) => {
    try {
      const reportResults = await apiFetch<Report[]>(API_ROUTES.reports.searchByStudent(normalizedStudentName), {
        headers: getAuthHeader(),
      })

      if (latestRequestRef.current !== requestId) {
        return
      }

      setReports(reportResults)
      setSearchedName(normalizedStudentName)
      setHasSearched(true)
    } catch (err) {
      if (latestRequestRef.current !== requestId) {
        return
      }

      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          setError('Session expired. Please log in again.')
          logout()
          onLogout()
          return
        }
        if (err.status === 400) {
          setError('Please enter a valid student name.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to search reports. Please try again.')
      }

      setReports([])
      setSearchedName(normalizedStudentName)
      setHasSearched(true)
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  const handleStudentNameChange = (value: string) => {
    setStudentName(value)
    setShareMessage('')
    setShareError('')

    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }

    if (error) {
      setError('')
    }

    if (!value.trim()) {
      latestRequestRef.current += 1
      setLoading(false)
      setReports([])
      setSearchedName('')
      setHasSearched(false)
      return
    }

    const normalizedStudentName = value.trim()
    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId
    setLoading(true)
    setError('')
    setShareMessage('')
    setShareError('')

    searchTimeoutRef.current = window.setTimeout(() => {
      void runSearch(normalizedStudentName, requestId)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current)
      }
      latestRequestRef.current += 1
    }
  }, [])

  const handleCopyPublicLink = async (reportId: number) => {
    setShareMessage('')
    setShareError('')

    try {
      await copyPublicReportLink(reportId)
      setShareMessage('Public link copied to clipboard.')
    } catch {
      setShareError('Failed to copy public link. Please try again.')
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
            mb: 3,
          }}
        >
          <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}>
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
          >
            Logout
          </Button>
        </Box>

        <Card sx={{ boxShadow: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Description color="primary" />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                Search Reports by Student
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Student Name"
                placeholder="Type full or partial name"
                value={studentName}
                onChange={(event) => handleStudentNameChange(event.target.value)}
                helperText={studentName.trim() ? 'Searching all reports automatically as you type.' : 'Start typing a student name to search all reports.'}
              />
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Searching for "{studentName.trim()}"...</Typography>
              </Box>
            )}

            {searchedName && !error && !loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {reports.length} result{reports.length === 1 ? '' : 's'} across all reports for "{searchedName}"
              </Typography>
            )}
          </CardContent>
        </Card>

        {shareMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {shareMessage}
          </Alert>
        )}

        {shareError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {shareError}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!error && hasSearched && searchedName && reports.length === 0 && !loading && (
          <Alert severity="info">No reports found for "{searchedName}".</Alert>
        )}

        {reports.length > 0 && (
          <>
            <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
              {reports.map((report) => (
                <Paper key={report.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {report.student}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip label={report.grade} size="small" variant="outlined" />
                    <Chip
                      label={report.reportType}
                      size="small"
                      color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                    />
                    <Chip label={`Author: ${report.authorUsername}`} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Created {formatDate(report.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" startIcon={<Visibility />} onClick={() => onViewReport(report.id)} sx={{ textTransform: 'none' }}>
                      View
                    </Button>
                    <Button size="small" color="secondary" startIcon={<LinkIcon />} onClick={() => handleCopyPublicLink(report.id)} sx={{ textTransform: 'none' }}>
                      Copy Link
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
              <Table sx={{ minWidth: 680 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Author</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                      <TableCell>{report.student}</TableCell>
                      <TableCell>{report.authorUsername}</TableCell>
                      <TableCell>
                        <Chip label={report.grade} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.reportType}
                          size="small"
                          color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(report.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Report">
                          <IconButton size="small" color="primary" onClick={() => onViewReport(report.id)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy Public Link">
                          <IconButton size="small" color="secondary" onClick={() => handleCopyPublicLink(report.id)}>
                            <LinkIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Container>
  )
}
