import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Person,
  Email,
  CalendarToday,
  Add,
  Logout,
  Description,
  Group,
  UploadFile,
  DeleteForever,
  Search,
  MarkEmailUnread,
  CheckCircle,
  Cancel,
  WarningAmber,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import type { UserInfo, Report, StudentBatchImportResponse } from '../types'

interface DashboardPageProps {
  onLogout: () => void
  onCreateReport: () => void
  onViewReport: (reportId: number) => void
  onViewUser: (userId: number) => void
  onSearchReports: () => void
  onViewUnreceivedReports: () => void
}

export default function DashboardPage({ onLogout, onCreateReport, onViewReport, onViewUser, onSearchReports, onViewUnreceivedReports }: DashboardPageProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [reportAgeCutoff] = useState(() => Date.now() - 3 * 24 * 60 * 60 * 1000)
  const [adminUsers, setAdminUsers] = useState<UserInfo[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [shareMessage] = useState<string>('')
  const [shareError] = useState<string>('')
  const [studentActionMessage, setStudentActionMessage] = useState<string>('')
  const [studentActionError, setStudentActionError] = useState<string>('')
  const [studentImportSummary, setStudentImportSummary] = useState<StudentBatchImportResponse | null>(null)
  const [importingStudents, setImportingStudents] = useState(false)
  const [deletingStudents, setDeletingStudents] = useState(false)
  const [showImportInfoDialog, setShowImportInfoDialog] = useState(false)
  const [showDeleteWarningDialog, setShowDeleteWarningDialog] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch user info and reports in parallel
      const [userData, reportsData] = await Promise.all([
        apiFetch<UserInfo>(API_ROUTES.users.me, {
          headers: getAuthHeader(),
        }),
        apiFetch<Report[]>(API_ROUTES.reports.me, {
          headers: getAuthHeader(),
        }),
      ])

      setUserInfo(userData)
      setReports(reportsData)

      // Load admin users only for admin accounts.
      if (userData.role === 'ADMIN') {
        setAdminLoading(true)
        setAdminError('')
        try {
          const usersData = await apiFetch<UserInfo[]>(API_ROUTES.admin.users, {
            headers: getAuthHeader(),
          })
          setAdminUsers(usersData)
        } catch (adminErr) {
          if (adminErr instanceof ApiError) {
            if (adminErr.status === 401) {
              setError('La sesión venció. Inicie sesión de nuevo.')
              handleLogout()
              return
            }
            if (adminErr.status === 403) {
              setAdminError('No tiene permiso para ver a los usuarios.')
            } else {
              setAdminError(adminErr.message)
            }
          } else {
            setAdminError('No se pudo cargar la lista de usuarios.')
          }
        } finally {
          setAdminLoading(false)
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          setError('La sesión venció. Inicie sesión de nuevo.')
          handleLogout()
          return
        }
        setError(err.message)
      } else {
        setError('No se pudieron cargar los datos del panel. Inténtelo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const isCurrentUserAdmin = userInfo?.role === 'ADMIN'

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

  const renderReportAgeWarning = (report: Report) => {
    const isOverdue = !report.received && new Date(report.createdAt).getTime() < reportAgeCutoff
    if (!isOverdue) {
      return null
    }

    return (
      <Tooltip title="Reporte con más de 3 días">
        <WarningAmber color="warning" fontSize="small" titleAccess="Reporte con más de 3 días" tabIndex={0} />
      </Tooltip>
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error'
      case 'USER':
        return 'primary'
      default:
        return 'default'
    }
  }


  const handleChooseImportFile = () => {
    if (importingStudents || deletingStudents) {
      return
    }
    setShowImportInfoDialog(true)
  }

  const handleConfirmImportDialog = () => {
    setShowImportInfoDialog(false)
    importFileInputRef.current?.click()
  }

  const handleImportStudents = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    setStudentActionMessage('')
    setStudentActionError('')
    setStudentImportSummary(null)
    setImportingStudents(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await apiFetch<StudentBatchImportResponse>(API_ROUTES.students.import, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      })

      setStudentImportSummary(response)
      setStudentActionMessage('La importación de alumnos se completó.')
    } catch (importErr) {
      if (importErr instanceof ApiError) {
        setStudentActionError(importErr.message)
      } else {
        setStudentActionError('No se pudieron importar los alumnos. Inténtelo de nuevo.')
      }
    } finally {
      setImportingStudents(false)
    }
  }

  const handleDeleteAllStudents = async () => {
    if (importingStudents || deletingStudents) {
      return
    }

    setShowDeleteWarningDialog(true)
  }

  const executeDeleteAllStudents = async () => {
    setShowDeleteWarningDialog(false)

    setStudentActionMessage('')
    setStudentActionError('')
    setStudentImportSummary(null)
    setDeletingStudents(true)

    try {
      await apiFetch<null>(API_ROUTES.students.base, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      setStudentActionMessage('Se eliminaron todos los registros de alumnos.')
    } catch (deleteErr) {
      if (deleteErr instanceof ApiError) {
        setStudentActionError(deleteErr.message)
      } else {
        setStudentActionError('No se pudieron eliminar los registros de alumnos. Inténtelo de nuevo.')
      }
    } finally {
      setDeletingStudents(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
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
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            mb: { xs: 3, sm: 4 },
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.8rem', sm: '2.125rem' }, width: '100%' }}>
            Panel
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
          >
            Cerrar sesión
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* User Info Card */}
        {userInfo && (
          <Card sx={{ mb: 4, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 64, sm: 80 },
                    height: { xs: 64, sm: 80 },
                    bgcolor: '#1976d2',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {userInfo.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                      {userInfo.fullName}
                    </Typography>
                    <Chip
                      label={userInfo.role === 'ADMIN' ? 'Admin' : userInfo.role === 'USER' ? 'Usuario' : userInfo.role}
                      color={getRoleColor(userInfo.role) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 3 }, color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">{userInfo.username}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email fontSize="small" />
                      <Typography variant="body2">{userInfo.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">
                        Se unió el {formatDate(userInfo.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Admin Panel */}
        {isCurrentUserAdmin && (
          <Card sx={{ mb: 4, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Group color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Administración de usuarios
                  </Typography>
                  <Chip label={adminUsers.length} size="small" color="primary" />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  Actualizar
                </Button>
              </Box>

              {adminError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {adminError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={importingStudents ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
                  onClick={handleChooseImportFile}
                  disabled={importingStudents || deletingStudents}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  {importingStudents ? 'Importando...' : 'Importar alumnos desde CSV'}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={deletingStudents ? <CircularProgress size={16} color="inherit" /> : <DeleteForever />}
                  onClick={handleDeleteAllStudents}
                  disabled={importingStudents || deletingStudents}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  {deletingStudents ? 'Eliminando...' : 'Eliminar todos los alumnos'}
                </Button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportStudents}
                  style={{ display: 'none' }}
                />
              </Box>

              {studentActionMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {studentActionMessage}
                </Alert>
              )}

              {studentActionError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {studentActionError}
                </Alert>
              )}

              {studentImportSummary && (
                <Alert severity={studentImportSummary.failedRows > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                  Se importaron {studentImportSummary.createdRows} de {studentImportSummary.totalRows} filas. Errores:{' '}
                  {studentImportSummary.failedRows}.
                  {studentImportSummary.errors.length > 0 && (
                    <>
                      {' '}
                      Primer error (fila {studentImportSummary.errors[0].row}): {studentImportSummary.errors[0].message}
                    </>
                  )}
                </Alert>
              )}

              {adminLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <>
                  <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
                    {adminUsers.map((user) => (
                      <Paper
                        key={user.id}
                        variant="outlined"
                        onClick={() => onViewUser(user.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onViewUser(user.id)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        sx={{
                          p: 1.5,
                          overflowWrap: 'anywhere',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s ease',
                          '&:hover': { boxShadow: 2 },
                          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                        }}
                      >
                         <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                           <Box>
                             <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                               {user.fullName}
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                               @{user.username}
                             </Typography>
                           </Box>
                          <Chip label={user.role === 'ADMIN' ? 'Admin' : user.role === 'USER' ? 'Usuario' : user.role} color={getRoleColor(user.role) as any} size="small" />
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {user.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Se unió el {formatDate(user.createdAt)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
                    <Table sx={{ minWidth: 680, tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflowWrap: 'anywhere' }}>Usuario</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Docente</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '32%' }}>Correo electrónico</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '12%' }}>Rol</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '18%' }}>Se unió</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {adminUsers.map((user) => (
                          <TableRow
                            key={user.id}
                            onClick={() => onViewUser(user.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                onViewUser(user.id)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            sx={{
                              '&:hover': { bgcolor: '#fafafa' },
                              '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '-2px',
                              },
                              cursor: 'pointer',
                            }}
                          >
                            <TableCell sx={{ overflowWrap: 'anywhere', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</TableCell>
                            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</TableCell>
                            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '32%' }}>{user.email}</TableCell>
                            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '12%' }}>
                              <Chip
                                label={user.role === 'ADMIN' ? 'Admin' : user.role === 'USER' ? 'Usuario' : user.role}
                                color={getRoleColor(user.role) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '18%' }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(user.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Description color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Mis incidencias
                </Typography>
                <Chip label={reports.length} size="small" color="primary" />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={onSearchReports}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  Buscar por alumno
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<MarkEmailUnread />}
                  onClick={onViewUnreceivedReports}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  Incidencias sin confirmar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={onCreateReport}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  Crear incidencia nueva
                </Button>
              </Box>
            </Box>

            {reports.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'text.secondary',
                }}
              >
                <Description sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Todavía no hay incidencias
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Cree su primera incidencia para comenzar
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={onCreateReport}
                  sx={{ textTransform: 'none' }}
                >
                  Crear reporte
                </Button>
              </Box>
            ) : (
              <>
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

                <Box sx={{ display: { xs: 'grid', sm: 'none' }, gridTemplateColumns: '1fr', gap: 1.5 }}>
                  {reports.map((report) => (
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
                        overflowWrap: 'anywhere',
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
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.82rem' }}>
                          Creado el {formatDate(report.createdAt)}
                          {renderReportAgeWarning(report)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                           {report.received ? <CheckCircle color="success" /> : <Cancel color="error" />}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                             {report.received ? 'Recibido' : 'No recibido'}
                           </Typography>
                         </Box>
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.82rem' }}>
                           Fecha de recepción: {report.reportReceivedDate ? formatDate(report.reportReceivedDate) : '—'}
                         </Typography>
                       </Paper>
                     ))}
                   </Box>

                   <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
                     <Table sx={{ minWidth: 800, tableLayout: 'fixed' }}>
                       <TableHead>
                         <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',width: '25%' }}>Alumno</TableCell>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap',width: '12%' }}>Grupo</TableCell>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Tipo</TableCell>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Fecha de creación</TableCell>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Fecha de recepción</TableCell>
                           <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">Recibido</TableCell>
                         </TableRow>
                       </TableHead>
                       <TableBody>
                         {reports.map((report) => (
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
                             <TableCell sx={{ overflowWrap: 'anywhere', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.student}</TableCell>
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
                               <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                 {formatDate(report.createdAt)}
                                 {renderReportAgeWarning(report)}
                               </Typography>
                             </TableCell>
                             <TableCell>
                               <Typography variant="body2" color="text.secondary">
                                 {report.reportReceivedDate ? formatDate(report.reportReceivedDate) : '—'}
                               </Typography>
                             </TableCell>
                             <TableCell align="center">
                               <Tooltip title={report.received ? 'Recibido' : 'No recibido'}>
                                 {report.received ? <CheckCircle color="success" /> : <Cancel color="error" />}
                               </Tooltip>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </TableContainer>
                 </>
             )}
           </CardContent>
         </Card>

         <Dialog open={showImportInfoDialog} onClose={() => setShowImportInfoDialog(false)} maxWidth="sm" fullWidth>
           <DialogTitle>Formato de importación CSV</DialogTitle>
           <DialogContent>
             <Typography variant="body2" sx={{ mb: 1 }}>
               Puede incluir una fila de encabezados opcional:
             </Typography>
             <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, mb: 2, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
               fullName,grade,contactemail1,contactemail2
             </Typography>
             <Typography variant="body2" sx={{ mb: 1 }}>
               Cada fila de datos debe tener 3 o 4 columnas:
             </Typography>
             <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
               fullName,grade,contactemail1[,contactemail2]
             </Typography>
           </DialogContent>
           <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', px: 2, pb: 2 }}>
             <Button onClick={() => setShowImportInfoDialog(false)} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Cancelar
             </Button>
             <Button variant="contained" onClick={handleConfirmImportDialog} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Seleccionar archivo CSV
             </Button>
           </DialogActions>
         </Dialog>

         <Dialog open={showDeleteWarningDialog} onClose={() => setShowDeleteWarningDialog(false)} maxWidth="sm" fullWidth>
           <DialogTitle>¿Eliminar a todos los alumnos?</DialogTitle>
           <DialogContent>
             <Alert severity="warning" sx={{ mb: 2 }}>
               Esta acción elimina permanentemente todos los registros de alumnos y no se puede deshacer.
             </Alert>
             <Typography variant="body2">
               Continúe solo si está seguro de que desea eliminar a todos los alumnos.
             </Typography>
           </DialogContent>
           <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', px: 2, pb: 2 }}>
             <Button onClick={() => setShowDeleteWarningDialog(false)} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Cancelar
             </Button>
             <Button
               variant="contained"
               color="error"
               onClick={executeDeleteAllStudents}
               disabled={deletingStudents}
               sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}
             >
               Eliminar a todos los alumnos
             </Button>
           </DialogActions>
         </Dialog>
       </Box>
     </Container>
   )
}
