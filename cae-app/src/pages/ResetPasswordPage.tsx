import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { apiFetch, ApiError } from '../api/client'
import { API_ROUTES } from '../api/routes'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    token: '',
    password: '',
    passwordConfirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Extract token from URL
    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid reset link. No token provided.')
      return
    }
    setFormData((prev) => ({
      ...prev,
      token,
    }))
  }, [searchParams])

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
      if (!formData.password || !formData.passwordConfirm) {
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

      // Validate passwords match
      if (formData.password !== formData.passwordConfirm) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      await apiFetch(API_ROUTES.auth.resetPassword, {
        method: 'POST',
        body: JSON.stringify({
          token: formData.token,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        }),
      })

      setSuccess('Password reset successfully! Redirecting to login...')
      setFormData({
        token: formData.token,
        password: '',
        passwordConfirm: '',
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connection failed. Please check your internet connection.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: { xs: 2, sm: 4 },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, width: '100%' }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
            }}
          >
            Reset Your Password
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your new password below
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1, width: '100%' }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 1, width: '100%' }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        {formData.token && (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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

            {/* Confirm Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="passwordConfirm"
                name="passwordConfirm"
                label="Confirm Password"
                type={showPasswordConfirm ? 'text' : 'password'}
                variant="outlined"
                value={formData.passwordConfirm}
                onChange={handleInputChange}
                disabled={loading}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading || !formData.password || !formData.passwordConfirm}
              sx={{
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}

