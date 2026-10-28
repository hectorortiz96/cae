import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  ArrowBack,
  Cancel,
  Description,
  Logout,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import type { Report } from '../types'
import TablePaginationControls from '../components/TablePaginationControls'
import { usePagination } from '../hooks/usePagination'

interface UnreceivedReportsPageProps {
  onBack: () => void
  onLogout: () => void
  onViewReport: (reportId: number) => void
}

export default function UnreceivedReportsPage({ onBack, onLogout, onViewReport }: UnreceivedReportsPageProps) {
  const [reports, setReports] = useState<Report[]>([])
  const { page, setPage, paginatedItems: paginatedReports } = usePagination(reports)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareMessage] = useState('')
  const [shareError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchUnreceivedReports = async () => {
      setLoading(true)
      setError('')

      try {
        const allReports = await apiFetch<Report[]>(API_ROUTES.reports.base, {
          headers: getAuthHeader(),
        })

        if (!isMounted) {
          return
        }

        setReports(allReports.filter((report) => !report.received))
      } catch (err) {
        if (!isMounted) {
          return
        }

        if (err instanceof ApiError) {
          if (err.status === 401 || err.status === 403) {
            setError('La sesión venció. Inicie sesión de nuevo.')
            logout()
            onLogout()
            return
          }
          setError(err.message)
        } else {
          setError('No se pudieron cargar las incidencias sin confirmar. Inténtelo de nuevo.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchUnreceivedReports()

    return () => {
      isMounted = false
    }
  }, [onLogout])

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
            Volver al panel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
          >
            Cerrar sesión
          </Button>
        </Box>

        <Card sx={{ boxShadow: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Description color="primary" />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                Incidencias sin confirmar
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Cargando incidencias sin confirmar...</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {reports.length} {reports.length === 1 ? 'incidencia pendiente de recepción' : 'incidencias pendientes de recepción'}
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

        {!error && !loading && reports.length === 0 && (
          <Alert severity="info">Se confirmó la recepción de todas las incidencias.</Alert>
        )}

        {!loading && reports.length > 0 && (
          <>
            <Box sx={{ display: { xs: 'grid', sm: 'none' }, gridTemplateColumns: '1fr', gap: 1.5 }}>
              {paginatedReports.map((report) => (
                <Paper
                  key={report.id}
                  variant="outlined"
                  onClick={() => onViewReport(report.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onViewReport(report.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  sx={{
                    width: '100%',
                    p: 1.5,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: 2 },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {report.student}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip label={report.grade} size="small" variant="outlined" />
                    <Chip
                      label={report.reportType}
                      size="small"
                      color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                    />
                    <Chip label={`Autor: ${report.authorFullName}`} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.82rem' }}>
                    Creado el {formatDate(report.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                    <Cancel color="error" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      No recibido
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
              <Table sx={{ minWidth: 680 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Alumno</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Autor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Grupo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Creado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">Recibido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow
                      key={report.id}
                      onClick={() => onViewReport(report.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onViewReport(report.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#fafafa' },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: '-2px',
                        },
                      }}
                    >
                      <TableCell>{report.student}</TableCell>
                      <TableCell>{report.authorFullName}</TableCell>
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
                        <Tooltip title="No recibido">
                          <Cancel color="error" />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationControls count={reports.length} page={page} onPageChange={setPage} />
          </>
        )}
      </Box>
    </Container>
  )
}
