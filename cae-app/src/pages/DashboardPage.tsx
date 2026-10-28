import { useState, useEffect } from 'react'
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
  IconButton,
  TextField,
} from '@mui/material'
import {
  Person,
  Email,
  CalendarToday,
  Edit,
  Add,
  Logout,
  Description,
  Group,
  UploadFile,
  Download,
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
import type { UserInfo, Report } from '../types'
import TablePaginationControls from '../components/TablePaginationControls'
import AdminReportDeletion from '../components/AdminReportDeletion'
import { usePagination } from '../hooks/usePagination'
import { useAdminUserEditor } from '../hooks/useAdminUserEditor'
import { useProfileEditor } from '../hooks/useProfileEditor'
import { useReportExport } from '../hooks/useReportExport'
import { useStudentActions } from '../hooks/useStudentActions'

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
  const { page: usersPage, setPage: setUsersPage, paginatedItems: paginatedUsers } = usePagination(adminUsers)
  const { page: reportsPage, setPage: setReportsPage, paginatedItems: paginatedReports } = usePagination(reports)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const updateAdminUser = (updatedUser: UserInfo) => {
    setAdminUsers((users) => users.map((user) => user.id === updatedUser.id ? updatedUser : user))
  }

  const profileEditor = useProfileEditor(userInfo, (updatedUser) => {
    setUserInfo(updatedUser)
    updateAdminUser(updatedUser)
  })
  const userEditor = useAdminUserEditor({
    userInfo,
    onUpdated: updateAdminUser,
    onCurrentUserUpdated: setUserInfo,
    onLogout: handleLogout,
  })
  const reportExport = useReportExport(handleLogout)
  const { fileInputRef: importFileInputRef, ...studentActions } = useStudentActions()

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
            <CardContent sx={{ p: { xs: 2, sm: 3 }, position: 'relative', pr: { xs: 7, sm: 8 } }}>
              <Tooltip title="Editar mis datos">
                <IconButton
                  aria-label="Editar mis datos"
                  onClick={profileEditor.openDialog}
                  sx={{ display: 'none', position: 'absolute', top: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 } }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
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

        <Dialog
          open={profileEditor.open}
          onClose={() => !profileEditor.saving && profileEditor.setOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <Box component="form" onSubmit={profileEditor.save}>
            <DialogTitle>Editar mis datos</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
              {profileEditor.error && <Alert severity="error">{profileEditor.error}</Alert>}
              <TextField
                label="Nombre completo"
                value={profileEditor.fullName}
                onChange={(event) => profileEditor.setFullName(event.target.value)}
                required
                disabled={profileEditor.saving}
                slotProps={{ htmlInput: { maxLength: 150 } }}
              />
              <TextField
                label="Nombre de usuario"
                value={profileEditor.username}
                onChange={(event) => profileEditor.setUsername(event.target.value)}
                required
                disabled={profileEditor.saving}
                slotProps={{ htmlInput: { minLength: 3, maxLength: 50 } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => profileEditor.setOpen(false)} disabled={profileEditor.saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={profileEditor.saving}>
                {profileEditor.saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Admin Panel */}
        {isCurrentUserAdmin && (
          <Dialog
            open={userEditor.editingUser !== null}
            onClose={() => !userEditor.saving && userEditor.setEditingUser(null)}
            aria-labelledby="edit-user-title"
            fullWidth
            maxWidth="xs"
          >
            <Box component="form" onSubmit={userEditor.save}>
              <DialogTitle id="edit-user-title">Editar usuario</DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                {userEditor.error && <Alert severity="error">{userEditor.error}</Alert>}
                {userEditor.editingUser?.id === userInfo?.id && (
                  <Alert severity="info">
                    Si cambia su nombre de usuario, se cerrará la sesión y deberá iniciar sesión de nuevo.
                  </Alert>
                )}
                <TextField
                  label="Nombre completo"
                  value={userEditor.form.fullName}
                  onChange={(event) => userEditor.setForm({ ...userEditor.form, fullName: event.target.value })}
                  required
                  autoFocus
                  disabled={userEditor.saving}
                  slotProps={{ htmlInput: { maxLength: 150 } }}
                />
                <TextField
                  label="Nombre de usuario"
                  value={userEditor.form.username}
                  onChange={(event) => userEditor.setForm({ ...userEditor.form, username: event.target.value })}
                  required
                  disabled={userEditor.saving}
                  slotProps={{ htmlInput: { minLength: 3, maxLength: 50 } }}
                />
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={userEditor.form.email}
                  onChange={(event) => userEditor.setForm({ ...userEditor.form, email: event.target.value })}
                  required
                  disabled={userEditor.saving}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => userEditor.setEditingUser(null)} disabled={userEditor.saving}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={userEditor.saving || userEditor.form.username.trim().length < 3 || !userEditor.form.fullName.trim() || !userEditor.form.email.trim()}
                >
                  {userEditor.saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogActions>
            </Box>
          </Dialog>
        )}

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

              {userEditor.message && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {userEditor.message}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={studentActions.importing ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
                  onClick={studentActions.chooseImportFile}
                  disabled={studentActions.importing || studentActions.deleting}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  {studentActions.importing ? 'Importando...' : 'Importar alumnos desde CSV'}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={studentActions.deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteForever />}
                  onClick={studentActions.confirmDeleteAll}
                  disabled={studentActions.importing || studentActions.deleting}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
                >
                  {studentActions.deleting ? 'Eliminando...' : 'Eliminar todos los alumnos'}
                </Button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={studentActions.importStudents}
                  style={{ display: 'none' }}
                />
              </Box>

              {studentActions.message && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {studentActions.message}
                </Alert>
              )}

              {studentActions.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {studentActions.error}
                </Alert>
              )}

              {studentActions.importSummary && (
                <Alert severity={studentActions.importSummary.failedRows > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                  Se importaron {studentActions.importSummary.createdRows} de {studentActions.importSummary.totalRows} filas. Errores:{' '}
                  {studentActions.importSummary.failedRows}.
                  {studentActions.importSummary.errors.length > 0 && (
                    <>
                      {' '}
                      Primer error (fila {studentActions.importSummary.errors[0].row}): {studentActions.importSummary.errors[0].message}
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
                    {paginatedUsers.map((user) => (
                      <Paper
                        key={user.id}
                        variant="outlined"
                        onClick={() => onViewUser(user.id)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return
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
                          <Button
                            startIcon={<Edit />}
                            aria-label={`Editar usuario ${user.username}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              userEditor.openDialog(user)
                            }}
                            sx={{ textTransform: 'none', minHeight: 44 }}
                          >
                            Editar
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
                    <Table sx={{ minWidth: 780, tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflowWrap: 'anywhere' }}>Usuario</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Docente</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '32%' }}>Correo electrónico</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '12%' }}>Rol</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: '18%' }}>Se unió</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', width: 100 }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedUsers.map((user) => (
                          <TableRow
                            key={user.id}
                            onClick={() => onViewUser(user.id)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return
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
                            <TableCell align="right">
                              <Button
                                size="small"
                                startIcon={<Edit />}
                                aria-label={`Editar usuario ${user.username}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  userEditor.openDialog(user)
                                }}
                                sx={{ textTransform: 'none', minHeight: 44 }}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePaginationControls count={adminUsers.length} page={usersPage} onPageChange={setUsersPage} />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isCurrentUserAdmin && (
          <Card sx={{ mb: 4, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Exportar incidencias
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Descargue todas las incidencias de todos los docentes en formato CSV.
              </Typography>
              {reportExport.error && <Alert severity="error" sx={{ mb: 2 }}>{reportExport.error}</Alert>}
              {reportExport.message && <Alert severity="info" sx={{ mb: 2 }}>{reportExport.message}</Alert>}
              <Button
                variant="outlined"
                startIcon={reportExport.exporting ? <CircularProgress size={18} /> : <Download />}
                onClick={reportExport.exportAllReports}
                disabled={reportExport.exporting}
                sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}
              >
                {reportExport.exporting ? 'Exportando...' : 'Exportar todas las incidencias'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isCurrentUserAdmin && (
          <AdminReportDeletion onDeleted={(before) => {
            const cutoff = Date.parse(`${before}T00:00:00Z`)
            setReports((currentReports) => currentReports.filter((report) => Date.parse(report.createdAt) >= cutoff))
          }} />
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
                   <TablePaginationControls count={reports.length} page={reportsPage} onPageChange={setReportsPage} />
                 </>
             )}
           </CardContent>
         </Card>

         <Dialog open={studentActions.showImportInfoDialog} onClose={() => studentActions.setShowImportInfoDialog(false)} maxWidth="sm" fullWidth>
           <DialogTitle>Formato de importación CSV</DialogTitle>
           <DialogContent>
             <Typography variant="body2" sx={{ mb: 1 }}>
               El archivo CSV debe incluir una fila de encabezados:
             </Typography>
             <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, mb: 2, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
               fullName,grade,contactemail1,contactemail2
             </Typography>
             <Typography variant="body2" sx={{ mb: 1 }}>
               Exemplo de formato de fila de datos:
             </Typography>
             <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
               Hector Ortiz Garza,1A,contacto1@ejemplo.com,contacto2@ejemplo.com (opcional)
             </Typography>
           </DialogContent>
           <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', px: 2, pb: 2 }}>
             <Button onClick={() => studentActions.setShowImportInfoDialog(false)} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Cancelar
             </Button>
             <Button variant="contained" onClick={studentActions.confirmImportDialog} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Seleccionar archivo CSV
             </Button>
           </DialogActions>
         </Dialog>

         <Dialog open={studentActions.showDeleteWarningDialog} onClose={() => studentActions.setShowDeleteWarningDialog(false)} maxWidth="sm" fullWidth>
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
             <Button onClick={() => studentActions.setShowDeleteWarningDialog(false)} sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
               Cancelar
             </Button>
             <Button
               variant="contained"
               color="error"
               onClick={studentActions.deleteAllStudents}
               disabled={studentActions.deleting}
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
