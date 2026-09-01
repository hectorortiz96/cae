import { useState, type FormEvent, type ChangeEvent } from 'react'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage({ onSwitchToRegister, onLoginSuccess }: { onSwitchToRegister?: () => void; onLoginSuccess?: () => void }) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate inputs
      if (!formData.username || !formData.password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      const data = await apiFetch<{
        token?: string
        expiresIn?: number
        user?: { id?: number; username?: string; role?: string }
      }>(API_ROUTES.auth.login, {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      // Login successful
      setError('')

      // Store authentication data in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token)
        if (data.expiresIn !== undefined) {
          localStorage.setItem('expiresIn', String(data.expiresIn))
        }

        // Store user info for quick access
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          if (data.user.id !== undefined) {
            localStorage.setItem('userId', String(data.user.id))
          }
          if (data.user.username) {
            localStorage.setItem('username', data.user.username)
          }
          // Store role if available in user object
          if (data.user.role) {
            localStorage.setItem('userRole', data.user.role)
          }
        }
      }

      // Redirect to dashboard
      onLoginSuccess?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connection failed. Ensure backend and frontend environment URLs are configured correctly.')
      } else {
        setError('Unexpected error during login.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Card
          sx={{
            width: '100%',
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  mb: 2,
                }}
              >
                <Lock sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Sign in to your account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  type="text"
                  variant="outlined"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Don't have an account?{' '}
                <Box
                  component="span"
                  onClick={onSwitchToRegister}
                  sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign up
                </Box>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Info Text */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            maxWidth: '100%',
            fontSize: '0.85rem',
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            API Endpoint: {import.meta.env.VITE_API_BASE_URL}
            {API_ROUTES.auth.login}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Backend must be running on port 8080
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Open browser DevTools (F12) Console tab to see request logs
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Make sure you have registered an account first at /auth/signup
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            Please check the console for detailed error messages if login fails.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

