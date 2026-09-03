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
  IconButton,
  Tooltip,
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
} from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, logout } from '../utils/authUtils'
import { copyPublicReportLink } from '../utils/publicReportLink'
import type { UserInfo, Report } from '../types'

interface DashboardPageProps {
  onLogout: () => void
  onCreateReport: () => void
  onViewReport: (reportId: number) => void
  onViewUser: (userId: number) => void
}

export default function DashboardPage({ onLogout, onCreateReport, onViewReport, onViewUser }: DashboardPageProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [adminUsers, setAdminUsers] = useState<UserInfo[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [shareMessage, setShareMessage] = useState<string>('')
  const [shareError, setShareError] = useState<string>('')

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
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Dashboard
          </Typography>
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

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* User Info Card */}
        {userInfo && (
          <Card sx={{ mb: 4, boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#1976d2',
                    fontSize: '2rem',
                  }}
                >
                  {userInfo.fullName?.charAt(0).toUpperCase() || userInfo.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {userInfo.fullName || userInfo.username}
                    </Typography>
                    <Chip
                      label={userInfo.role}
                      color={getRoleColor(userInfo.role) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, color: 'text.secondary' }}>
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
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  sx={{ textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Box>

              {adminError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {adminError}
                </Alert>
              )}

              {adminLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  My Reports
                </Typography>
                <Chip label={reports.length} size="small" color="primary" />
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onCreateReport}
                sx={{ textTransform: 'none' }}
              >
                Create New Report
              </Button>
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

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
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
                        <TableCell>{report.studentName}</TableCell>
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
      </Box>
    </Container>
  )
}


