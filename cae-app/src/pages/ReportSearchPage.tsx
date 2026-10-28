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
  Cancel,
  CheckCircle,
  Description,
  Edit,
  Logout,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, isAdmin, logout } from '../utils/authUtils'
import type { Report } from '../types'
import TablePaginationControls from '../components/TablePaginationControls'
import { usePagination } from '../hooks/usePagination'

interface ReportSearchPageProps {
  onBack: () => void
  onLogout: () => void
  onViewReport: (reportId: number) => void
  onEditStudent: (studentName: string) => void
}

export default function ReportSearchPage({ onBack, onLogout, onViewReport, onEditStudent }: ReportSearchPageProps) {
  const admin = isAdmin()
  const [studentName, setStudentName] = useState('')
  const [searchedName, setSearchedName] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const { page, setPage, paginatedItems: paginatedReports } = usePagination(reports)
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
    return new Date(dateString).toLocaleDateString('es-MX', {
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
          setError('La sesión venció. Inicie sesión de nuevo.')
          logout()
          onLogout()
          return
        }
        if (err.status === 400) {
          setError('Ingrese un nombre de alumno válido.')
        } else {
          setError(err.message)
        }
      } else {
        setError('No se pudieron buscar las incidencias. Inténtelo de nuevo.')
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
    setPage(0)
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
                Buscar incidencias por alumno
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Nombre del alumno"
                placeholder="Escriba el nombre completo o una parte"
                value={studentName}
                onChange={(event) => handleStudentNameChange(event.target.value)}
                helperText={studentName.trim() ? 'Buscando automáticamente todas las incidencias mientras escribe.' : 'Empiece a escribir el nombre de un alumno para buscar en todas las incidencias.'}
              />
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Buscando "{studentName.trim()}"...</Typography>
              </Box>
            )}

            {searchedName && !error && !loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {reports.length} {reports.length === 1 ? 'resultado' : 'resultados'} en todas las incidencias para "{searchedName}"
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
          <Alert severity="info">No se encontraron incidencias para "{searchedName}".</Alert>
        )}

        {reports.length > 0 && (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {admin && (
                      <Tooltip title="Editar alumno">
                        <IconButton
                          size="small"
                          aria-label={`Editar alumno ${report.student}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditStudent(report.student)
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {report.student}
                    </Typography>
                  </Box>
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
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.82rem' }}>
                    Fecha de recepción: {report.reportReceivedDate ? formatDate(report.reportReceivedDate) : '—'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                    {report.received ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      {report.received ? 'Recibido' : 'No recibido'}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
              <Table sx={{ minWidth: 1040, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ ...tableTextCellSx, fontWeight: 'bold', width: '22%' }}>Alumno</TableCell>
                    <TableCell sx={{ ...tableTextCellSx, fontWeight: 'bold', width: '20%' }}>Autor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '10%' }}>Grupo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '11%' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '13%' }}>Creado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '15%' }}>Fecha de recepción</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '9%' }} align="center">Recibido</TableCell>
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
                      <TableCell sx={{ ...tableTextCellSx, width: '22%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {admin && (
                            <Tooltip title="Editar alumno">
                              <IconButton
                                size="small"
                                aria-label={`Editar alumno ${report.student}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onEditStudent(report.student)
                                }}
                                onKeyDown={(event) => event.stopPropagation()}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={report.student}>
                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {report.student}
                            </Box>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...tableTextCellSx, width: '20%' }}>
                        <Tooltip title={report.authorFullName}>
                          <span>{report.authorFullName}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ width: '10%' }}>
                        <Chip label={report.grade} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ width: '11%' }}>
                        <Chip
                          label={report.reportType}
                          size="small"
                          color={report.reportType === 'Reporte' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell sx={{ width: '13%' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(report.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '15%' }}>
                        <Typography variant="body2" color="text.secondary">
                          {report.reportReceivedDate ? formatDate(report.reportReceivedDate) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ width: '9%' }}>
                        <Tooltip title={report.received ? 'Recibido' : 'No recibido'}>
                          {report.received ? <CheckCircle color="success" /> : <Cancel color="error" />}
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

const tableTextCellSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 0,
} as const
