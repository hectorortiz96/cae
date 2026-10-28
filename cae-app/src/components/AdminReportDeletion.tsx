import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { DeleteForever } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader } from '../utils/authUtils'

interface AdminReportDeletionProps {
  onDeleted: (before: string) => void
}

export default function AdminReportDeletion({ onDeleted }: AdminReportDeletionProps) {
  const [before, setBefore] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const requestConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setConfirming(true)
  }

  const deleteReports = async () => {
    if (deleting) return
    setDeleting(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch<{ deletedCount: number }>(API_ROUTES.admin.deleteReportsBefore(before), {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      onDeleted(before)
      setMessage(response.deletedCount === 0
        ? 'No se encontraron incidencias anteriores a la fecha seleccionada.'
        : `Se eliminaron ${response.deletedCount} incidencias.`)
      setConfirming(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron eliminar las incidencias. Intente de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card sx={{ mb: 4, boxShadow: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Eliminar incidencias anteriores a una fecha
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Elimine permanentemente las incidencias de todos los docentes creadas antes de la fecha seleccionada.
          Se conservan las incidencias de esa fecha y posteriores.
        </Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <Box
          component="form"
          onSubmit={requestConfirmation}
          sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-start' }, gap: 2 }}
        >
          <TextField
            label="Eliminar incidencias anteriores al"
            type="date"
            value={before}
            onChange={(event) => {
              setBefore(event.target.value)
              setMessage('')
              setError('')
            }}
            required
            disabled={confirming}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: '0001-01-01', max: '9999-12-31' } }}
            sx={{ minWidth: { sm: 280 } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="error"
            startIcon={<DeleteForever />}
            disabled={!before || confirming}
            sx={{ textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}
          >
            Eliminar incidencias
          </Button>
        </Box>
      </CardContent>
      <Dialog
        open={confirming}
        onClose={() => !deleting && setConfirming(false)}
        aria-labelledby="delete-reports-title"
        aria-describedby="delete-reports-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-reports-title">Confirmar borrado de incidencias</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Alert severity="warning" id="delete-reports-description">
            Se borran permanentemente todas las incidencias creadas antes del {before},
            de todos los docentes, recibidas o no. Las incidencias del {before} y posteriores se conservan.
            Esta operaci&oacute;n no se puede deshacer. Los alumnos y usuarios no se eliminan.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setConfirming(false)} disabled={deleting} autoFocus>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={deleteReports}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteForever />}
            sx={{ textTransform: 'none', minHeight: 44 }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
