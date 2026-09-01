import { useState } from 'react'
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
import { Lock, Person, Email, ManageAccounts, Visibility, VisibilityOff } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'

interface RegisterFormData {
  username: string
  password: string
  email: string
  fullName: string
}

export default function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin?: () => void }) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    email: '',
    fullName: '',
  })
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate inputs
      if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      // Validate password length
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      await apiFetch(API_ROUTES.auth.signup, {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
        }),
      })

      // Registration successful
      setSuccess(`Account created successfully! You can now login with username: ${formData.username}`)
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connection failed. Ensure backend and frontend environment URLs are configured correctly.')
      } else {
        setError('Unexpected error during registration.')
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
                <ManageAccounts sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Register for a new account
              </Typography>
            </Box>

            {/* Success Alert */}
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
                {success}
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            {/* Registration Form */}
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

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  type="text"
                  variant="outlined"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
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
                  helperText="Minimum 6 characters"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Already have an account?{' '}
                <Box
                  component="span"
                  onClick={onSwitchToLogin}
                  sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign in
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
            {API_ROUTES.auth.signup}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Backend must be running on port 8080
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Username must be 3-50 characters
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Password must be at least 6 characters
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Email must be unique
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            Please check the browser console (F12) for detailed error messages if registration fails.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}




