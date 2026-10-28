import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Link,
} from '@mui/material'
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material'
import { API_BASE_URL, ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import caeLogo from '../assets/cae_logo.png'

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage({ onSwitchToRegister, onLoginSuccess }: { onSwitchToRegister?: () => void; onLoginSuccess?: () => void }) {
  const navigate = useNavigate()
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
        setError('Complete todos los campos.')
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
        setError(
          err.status === 401 || err.message.trim().toLowerCase() === 'bad credentials'
            ? 'El nombre de usuario o la contraseña son incorrectos.'
            : err.message,
        )
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('No se pudo establecer la conexión. Verifique que las URL del entorno del servidor y del sitio estén configuradas correctamente.')
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.')
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
        <Card
          sx={{
            width: '100%',
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                component="img"
                src={caeLogo}
                alt="Logotipo de CAE"
                sx={{ width: 224, height: 224, objectFit: 'contain', mb: 2 }}
              >
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>
                Bienvenido
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Inicie sesión en su cuenta
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
                  label="Nombre de usuario o correo electrónico"
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
                  label="Contraseña"
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
                            aria-label="Mostrar u ocultar contraseña"
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

               <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                 <Link
                   component="button"
                   type="button"
                   variant="body2"
                   onClick={(e) => {
                     e.preventDefault()
                     navigate('/forgot-password')
                   }}
                   sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                 >
                   ¿Olvidó su contraseña?
                 </Link>
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ display: 'none', mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿No tiene una cuenta?{' '}
                <Box
                  component="span"
                  onClick={onSwitchToRegister}
                  sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Regístrese
                </Box>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Info Text */}
        <Box
          sx={{display: 'none',
            mt: { xs: 2.5, sm: 4 },
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            maxWidth: '100%',
            fontSize: '0.85rem',
            color: 'text.secondary',
            textAlign: 'left',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Punto de conexión de API: {API_BASE_URL}
            {API_ROUTES.auth.login}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ El servidor debe estar ejecutándose en el puerto 8080
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Abra la consola de herramientas del navegador (F12) para ver los registros de solicitudes
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ Primero debe registrar una cuenta en /auth/signup
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            Si no puede iniciar sesión, consulte la consola para ver los mensajes de error detallados.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
