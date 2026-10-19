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

export default function RegisterPage({ onSwitchToLogin, onSuccess }: { onSwitchToLogin?: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    email: '',
    fullName: '',
  })
  const [error, setError] = useState<string>('')
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

    try {
      // Validate inputs
      if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
        setError('Complete todos los campos.')
        setLoading(false)
        return
      }

      // Validate password length
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Ingrese una dirección de correo electrónico válida.')
        setLoading(false)
        return
      }

      if (!formData.email.toLowerCase().endsWith('@cae.edu.mx')) {
        setError('El correo electrónico debe usar el dominio @cae.edu.mx.')
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

      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('No se pudo establecer la conexión. Verifique que las URL del entorno del servidor y del sitio estén configuradas correctamente.')
      } else {
        setError('Ocurrió un error inesperado durante el registro.')
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
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>
                Crear cuenta
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Regístrese para crear una cuenta nueva
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
              Le recomendamos usar la misma dirección de correo electrónico y el mismo nombre de usuario que en su cuenta educativa.
            </Alert>

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
                  label="Nombre de usuario"
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
                  label="Nombre completo"
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
                  label="Correo electrónico"
                  type="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  helperText="Utilice su dirección de correo electrónico @cae.edu.mx"
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
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  helperText="Mínimo 6 caracteres"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Ya tiene una cuenta?{' '}
                <Box
                  component="span"
                  onClick={onSwitchToLogin}
                  sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Inicie sesión
                </Box>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Info Text */}
        <Box
          sx={{
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
            Punto de conexión de API: {import.meta.env.VITE_API_BASE_URL}
            {API_ROUTES.auth.signup}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ El servidor debe estar ejecutándose en el puerto 8080
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ El nombre de usuario debe tener entre 3 y 50 caracteres
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ La contraseña debe tener al menos 6 caracteres
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ El correo electrónico debe ser único
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            ✓ El correo electrónico debe usar el dominio @cae.edu.mx
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            Si el registro falla, consulte la consola del navegador (F12) para ver los mensajes de error detallados.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
