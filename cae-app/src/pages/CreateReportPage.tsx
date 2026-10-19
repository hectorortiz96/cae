import { useEffect, useState } from 'react'
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Description, ArrowBack, Save } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader, getUser } from '../utils/authUtils'
import { blobToBase64 } from '../utils/blobToBase64'
import { buildReportPdfFile } from '../utils/reportPdfExport'
import type { Grade, Report, ReportCreateRequest, ReportFormData, Student } from '../types'

interface CreateReportPageProps {
  onBack: () => void
  onSuccess: () => void
}

const GRADES: Grade[] = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']
const REPORT_TYPES = [
  { value: 'Observación', label: 'Observación' },
  { value: 'Reporte', label: 'Reporte' },
]

export default function CreateReportPage({ onBack, onSuccess }: CreateReportPageProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [formData, setFormData] = useState<ReportFormData>({
    content: '',
    student: '',
    grade: '',
    reportType: '',
  })
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentInputValue, setStudentInputValue] = useState<string>('')
  const [errors, setErrors] = useState<Partial<ReportFormData>>({})
  const [apiError, setApiError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const filteredStudents = formData.grade
    ? students.filter((student) => student.grade === formData.grade)
    : []

  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true)
      setStudentLoadError('')

      try {
        const studentsData = await apiFetch<Student[]>(API_ROUTES.students.base, {
          headers: getAuthHeader(),
        })
        setStudents(studentsData)
      } catch (err) {
        if (err instanceof ApiError) {
          setStudentLoadError(err.message)
        } else {
          setStudentLoadError('No se pudieron cargar los alumnos. Inténtelo de nuevo.')
        }
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target
    if (name === 'grade') {
      const shouldClearStudent = selectedStudent && selectedStudent.grade !== value

      if (shouldClearStudent) {
        setSelectedStudent(null)
        setStudentInputValue('')
      }

      setFormData((prev) => ({
        ...prev,
        grade: value,
        student: shouldClearStudent ? '' : prev.student,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    // Clear field error when user starts typing
    if (errors[name as keyof ReportFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
    setApiError('')
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ReportFormData> = {}

    if (!formData.student.trim()) {
      newErrors.student = 'Seleccione un alumno de la lista.'
    } else if (formData.student.length > 150) {
      newErrors.student = 'El nombre del alumno no debe superar los 150 caracteres.'
    }

    if (!formData.grade) {
      newErrors.grade = 'El grupo es obligatorio.'
    }

    if (!formData.reportType) {
      newErrors.reportType = 'El tipo de reporte es obligatorio.'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido del reporte es obligatorio.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStudentChange = (_: unknown, value: Student | null) => {
    setSelectedStudent(value)
    setStudentInputValue(value?.fullName ?? '')
    setFormData((prev) => ({
      ...prev,
      student: value?.fullName ?? '',
    }))

    if (errors.student) {
      setErrors((prev) => ({
        ...prev,
        student: undefined,
      }))
    }
    setApiError('')
  }

  const handleStudentInputChange = (_: unknown, value: string, reason: string) => {
    setStudentInputValue(value)

    if (reason === 'clear') {
      setSelectedStudent(null)
      setFormData((prev) => ({
        ...prev,
        student: '',
      }))
    } else if (selectedStudent && value !== selectedStudent.fullName) {
      setSelectedStudent(null)
      setFormData((prev) => ({
        ...prev,
        student: '',
      }))
    }

    if (errors.student) {
      setErrors((prev) => ({
        ...prev,
        student: undefined,
      }))
    }
    setApiError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setConfirmDialogOpen(true)
  }

  const handleConfirmCreate = async () => {
    setLoading(true)
    setApiError('')

    try {
      const nowIso = new Date().toISOString()
      const draftReport: Report = {
        id: 0,
        content: formData.content,
        student: formData.student,
        grade: formData.grade as Grade,
        reportType: formData.reportType,
        authorUsername: getUser()?.username || 'unknown',
        authorFullName: getUser()?.fullName || 'unknown',
        createdAt: nowIso,
        received: false,
        reportReceivedDate: null,
      }

      const { blob, fileName, mimeType } = await buildReportPdfFile(
        draftReport,
        `report-draft-${Date.now()}.pdf`,
      )
      const payload: ReportCreateRequest = {
        ...formData,
        pdfBase64: await blobToBase64(blob),
        pdfFileName: fileName,
        pdfMimeType: mimeType,
      }

      await apiFetch(API_ROUTES.reports.base, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      })

      setConfirmDialogOpen(false)
      setSuccess(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setConfirmDialogOpen(false)
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('No se pudo crear el reporte. Inténtelo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Volver al panel
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 44, sm: 48 },
                height: { xs: 44, sm: 48 },
                borderRadius: '50%',
                backgroundColor: '#1976d2',
              }}
            >
              <Description sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>
                Crear incidencia
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete los datos a continuación para crear una incidencia nueva
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            La incidencia se creó correctamente. Redirigiendo al panel...
          </Alert>
        )}

        {/* Error Alert */}
        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {apiError}
          </Alert>
        )}

        {/* Form Card */}
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Grade and Report Type Row */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth error={!!errors.grade}>
                  <InputLabel id="grade-label">Grupo</InputLabel>
                  <Select
                    labelId="grade-label"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    label="Grupo"
                    onChange={(e) =>
                      handleInputChange({ target: { name: 'grade', value: e.target.value } })
                    }
                    disabled={loading || success}
                  >
                    {GRADES.map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.grade && <FormHelperText>{errors.grade}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth error={!!errors.reportType}>
                  <InputLabel id="reportType-label">Tipo de reporte</InputLabel>
                  <Select
                    labelId="reportType-label"
                    id="reportType"
                    name="reportType"
                    value={formData.reportType}
                    label="Tipo de reporte"
                    onChange={(e) =>
                      handleInputChange({ target: { name: 'reportType', value: e.target.value } })
                    }
                    disabled={loading || success}
                  >
                    {REPORT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.reportType && <FormHelperText>{errors.reportType}</FormHelperText>}
                </FormControl>
              </Box>

              {/* Student Name */}
              <Box sx={{ mb: 3 }}>
                <Autocomplete
                    fullWidth
                    id="student"
                    options={filteredStudents}
                    value={selectedStudent}
                    inputValue={studentInputValue}
                    loading={loadingStudents}
                    openOnFocus
                    onChange={handleStudentChange}
                    onInputChange={handleStudentInputChange}
                    getOptionLabel={(option) => option.fullName}
                    isOptionEqualToValue={(option, value) => option.contactemail1 === value.contactemail1}
                    disabled={loading || success || !formData.grade}
                    noOptionsText={
                      loadingStudents
                          ? 'Cargando alumnos...'
                          : formData.grade
                              ? 'No se encontraron alumnos que coincidan'
                              : 'Seleccione primero un grupo'
                    }
                    renderOption={(props, option) => (
                        <li {...props} key={option.contactemail1}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {option.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.contactemail1} {option.contactemail2?.trim() ? ` • ${option.contactemail2}` : ''}
                            </Typography>
                          </Box>
                        </li>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Nombre del alumno"
                            variant="outlined"
                            placeholder={formData.grade ? 'Escriba para buscar alumnos' : 'Seleccione primero un grupo'}
                            error={!!errors.student || !!studentLoadError}
                            helperText={
                                errors.student || studentLoadError ||
                                (formData.grade
                                    ? `Seleccione un alumno del grupo ${formData.grade}`
                                    : 'Seleccione primero un grupo para cargar los alumnos')
                            }
                        />
                    )}
                />
              </Box>

              {/* Content */}
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  id="content"
                  name="content"
                  label="Contenido del reporte"
                  variant="outlined"
                  multiline
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  placeholder="Ingrese el contenido detallado del reporte..."
                  error={!!errors.content}
                  helperText={errors.content || 'Describa las observaciones o los detalles del reporte'}
                />
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                <Button
                  variant="outlined"
                  onClick={onBack}
                  disabled={loading || success}
                  sx={{ textTransform: 'none', px: 4, width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || success}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  sx={{ textTransform: 'none', px: 4, width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 'Creando...' : 'Crear incidencia'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Dialog
          open={confirmDialogOpen}
          onClose={() => {
            if (!loading) {
              setConfirmDialogOpen(false)
            }
          }}
          maxWidth="sm"
          fullWidth
          aria-labelledby="confirm-report-title"
        >
          <DialogTitle id="confirm-report-title">Revise los datos del reporte</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Revise los datos antes de crear este reporte.
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">Alumno</Typography>
            <Typography sx={{ mb: 2 }}>{formData.student}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Grupo</Typography>
            <Typography sx={{ mb: 2 }}>{formData.grade}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Tipo de reporte</Typography>
            <Typography sx={{ mb: 2 }}>{formData.reportType}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Contenido del reporte</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {formData.content || 'No se proporcionó contenido'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Volver
            </Button>
            <Button
              onClick={handleConfirmCreate}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
              sx={{ textTransform: 'none' }}
            >
              {loading ? 'Creando...' : 'Confirmar y crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}
