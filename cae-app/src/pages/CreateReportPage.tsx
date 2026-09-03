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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from '@mui/material'
import { Description, ArrowBack, Save } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader } from '../utils/authUtils'
import type { ReportFormData } from '../types'

interface CreateReportPageProps {
  onBack: () => void
  onSuccess: () => void
}

const GRADES = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']
const REPORT_TYPES = [
  { value: 'Observación', label: 'Observación' },
  { value: 'Reporte', label: 'Reporte' },
]

export default function CreateReportPage({ onBack, onSuccess }: CreateReportPageProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    content: '',
    studentName: '',
    grade: '',
    reportType: '',
  })
  const [errors, setErrors] = useState<Partial<ReportFormData>>({})
  const [apiError, setApiError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required'
    } else if (formData.studentName.length > 150) {
      newErrors.studentName = 'Student name must not exceed 150 characters'
    }

    if (!formData.grade) {
      newErrors.grade = 'Grade is required'
    }

    if (!formData.reportType) {
      newErrors.reportType = 'Report type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError('')

    try {
      await apiFetch(API_ROUTES.reports.base, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(formData),
      })

      setSuccess(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('Failed to create report. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Back to Dashboard
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#1976d2',
              }}
            >
              <Description sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Create New Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fill in the details below to create a new report
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Report created successfully! Redirecting to dashboard...
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
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Student Name */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="studentName"
                  name="studentName"
                  label="Student Name"
                  variant="outlined"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  error={!!errors.studentName}
                  helperText={errors.studentName || 'Full name of the student'}
                  placeholder="Enter the student's full name"
                />
              </Box>

              {/* Grade and Report Type Row */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <FormControl fullWidth error={!!errors.grade}>
                  <InputLabel id="grade-label">Grade</InputLabel>
                  <Select
                    labelId="grade-label"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    label="Grade"
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
                  <InputLabel id="reportType-label">Report Type</InputLabel>
                  <Select
                    labelId="reportType-label"
                    id="reportType"
                    name="reportType"
                    value={formData.reportType}
                    label="Report Type"
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

              {/* Content */}
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  id="content"
                  name="content"
                  label="Report Content"
                  variant="outlined"
                  multiline
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  placeholder="Enter the detailed content of the report..."
                  helperText="Describe the observations or report details"
                />
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={onBack}
                  disabled={loading || success}
                  sx={{ textTransform: 'none', px: 4 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || success}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  sx={{ textTransform: 'none', px: 4 }}
                >
                  {loading ? 'Creating...' : 'Create Report'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

