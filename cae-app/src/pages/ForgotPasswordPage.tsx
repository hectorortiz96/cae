import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { apiFetch, ApiError } from '../api/client'
import { API_ROUTES } from '../api/routes'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      await apiFetch(API_ROUTES.auth.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setSuccess('Password reset email sent! Check your inbox for instructions.')
      setEmail('')

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
        {/* Back Button */}
        <Box sx={{ alignSelf: 'flex-start', mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/login')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
            Back to Login
          </Link>
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
            }}
          >
            Forgot Your Password?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your email address and we'll send you a link to reset your password.
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
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Enter your email"
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={loading || !email}
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
              'Send Reset Link'
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

