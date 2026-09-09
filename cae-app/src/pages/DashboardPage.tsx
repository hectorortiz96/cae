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
  IconButton,
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
  Visibility,
  Link as LinkIcon,
  Group,
  UploadFile,
  DeleteForever,
  Search,
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import { copyPublicReportLink } from '../utils/publicReportLink'
import type { UserInfo, Report, StudentBatchImportResponse } from '../types'

interface DashboardPageProps {
  onLogout: () => void
  onCreateReport: () => void
  onViewReport: (reportId: number) => void
  onViewUser: (userId: number) => void
  onSearchReports: () => void
}

export default function DashboardPage({ onLogout, onCreateReport, onViewReport, onViewUser, onSearchReports }: DashboardPageProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [adminUsers, setAdminUsers] = useState<UserInfo[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [shareMessage, setShareMessage] = useState<string>('')
  const [shareError, setShareError] = useState<string>('')
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
              setError('Session expired. Please log in again.')
              handleLogout()
              return
            }
            if (adminErr.status === 403) {
              setAdminError('You do not have permission to view users.')
            } else {
              setAdminError(adminErr.message)
            }
          } else {
            setAdminError('Failed to load users list.')
          }
        } finally {
          setAdminLoading(false)
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          setError('Session expired. Please log in again.')
          handleLogout()
          return
        }
        setError(err.message)
      } else {
        setError('Failed to load dashboard data. Please try again.')
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
      setStudentActionMessage('Student import completed.')
    } catch (importErr) {
      if (importErr instanceof ApiError) {
        setStudentActionError(importErr.message)
      } else {
        setStudentActionError('Failed to import students. Please try again.')
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
      setStudentActionMessage('All student records were deleted.')
    } catch (deleteErr) {
      if (deleteErr instanceof ApiError) {
        setStudentActionError(deleteErr.message)
      } else {
        setStudentActionError('Failed to delete student records. Please try again.')
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
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
            Dashboard
          </Typography>
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
                  {userInfo.fullName?.charAt(0).toUpperCase() || userInfo.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                      {userInfo.fullName || userInfo.username}
                    </Typography>
                    <Chip
                      label={userInfo.role}
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
                        Joined {formatDate(userInfo.createdAt)}
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
                    Admin Panel - Users
                  </Typography>
                  <Chip label={adminUsers.length} size="small" color="primary" />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  Refresh
                </Button>
              </Box>

              {adminError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {adminError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={importingStudents ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
                  onClick={handleChooseImportFile}
                  disabled={importingStudents || deletingStudents}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  {importingStudents ? 'Importing...' : 'Import Students CSV'}
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={deletingStudents ? <CircularProgress size={16} color="inherit" /> : <DeleteForever />}
                  onClick={handleDeleteAllStudents}
                  disabled={importingStudents || deletingStudents}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  {deletingStudents ? 'Deleting...' : 'Delete All Students'}
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
                  Imported {studentImportSummary.createdRows} of {studentImportSummary.totalRows} rows. Failed:{' '}
                  {studentImportSummary.failedRows}.
                  {studentImportSummary.errors.length > 0 && (
                    <>
                      {' '}
                      First error (row {studentImportSummary.errors[0].row}): {studentImportSummary.errors[0].message}
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
                      <Paper key={user.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {user.fullName || user.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                          <Chip label={user.role} color={getRoleColor(user.role) as any} size="small" />
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {user.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Joined {formatDate(user.createdAt)}
                          </Typography>
                          <Button size="small" startIcon={<Visibility />} onClick={() => onViewUser(user.id)} sx={{ textTransform: 'none' }}>
                            View
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', display: { xs: 'none', sm: 'block' } }}>
                    <Table size="small" sx={{ minWidth: 760 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Username</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Full Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Joined</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="center">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {adminUsers.map((user) => (
                          <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role}
                                color={getRoleColor(user.role) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(user.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View User Details">
                                <IconButton size="small" color="primary" onClick={() => onViewUser(user.id)}>
                                  <Visibility />
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
                  My Reports
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
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  Search by Student
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={onCreateReport}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  Create New Report
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
                  No reports yet
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Create your first report to get started
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={onCreateReport}
                  sx={{ textTransform: 'none' }}
                >
                  Create Report
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
                        <TableRow
                          key={report.id}
                          sx={{ '&:hover': { bgcolor: '#fafafa' } }}
                        >
                          <TableCell>{report.student}</TableCell>
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
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onViewReport(report.id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy Public Link">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleCopyPublicLink(report.id)}
                              >
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
          </CardContent>
        </Card>

        <Dialog open={showImportInfoDialog} onClose={() => setShowImportInfoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>CSV Import Format</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Use an optional header row:
            </Typography>
            <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, mb: 2, overflowX: 'auto' }}>
              fullName,grade,contactemail1,contactemail2
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Each data row must have 3 or 4 columns:
            </Typography>
            <Typography component="pre" variant="body2" sx={{ p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, overflowX: 'auto' }}>
              fullName,grade,contactemail1[,contactemail2]
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowImportInfoDialog(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleConfirmImportDialog} sx={{ textTransform: 'none' }}>
              Choose CSV File
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showDeleteWarningDialog} onClose={() => setShowDeleteWarningDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete All Students?</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action permanently deletes all student records and cannot be undone.
            </Alert>
            <Typography variant="body2">
              Only continue if you are sure you want to remove every student.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteWarningDialog(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={executeDeleteAllStudents}
              disabled={deletingStudents}
              sx={{ textTransform: 'none' }}
            >
              Delete All Students
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

