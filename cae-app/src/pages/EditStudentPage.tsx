import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, MenuItem, TextField, Typography } from '@mui/material'
import { ArrowBack, Save } from '@mui/icons-material'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import { getAuthHeader } from '../utils/authUtils'
import type { Grade, Student } from '../types'

interface EditStudentPageProps {
  studentName: string
  onBack: () => void
  onSaved: (studentName: string) => void
}

const GRADES: Grade[] = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']

export default function EditStudentPage({ studentName, onBack, onSaved }: EditStudentPageProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [originalEmail, setOriginalEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const loadStudent = async () => {
      setLoading(true)
      setStudent(null)
      setError('')
      try {
        const result = await apiFetch<Student>(API_ROUTES.students.details(studentName), { headers: getAuthHeader() })
        if (active) {
          setStudent(result)
          setOriginalEmail(result.contactemail1)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Failed to load student. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadStudent()
    return () => { active = false }
  }, [studentName, loadAttempt])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!student) return
    setError('')
    setSuccess(false)
    if (!student.fullName.trim() || !student.contactemail1.trim()) {
      setError('Full name and primary contact email are required.')
      return
    }
    setSaving(true)
    try {
      const result = await apiFetch<Student>(API_ROUTES.students.update(originalEmail), {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(student),
      })
      setStudent(result)
      setOriginalEmail(result.contactemail1)
      setSuccess(true)
      onSaved(result.fullName)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save student. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof Student, value: string) => {
    setStudent((current) => current ? { ...current, [field]: value } : current)
    setSuccess(false)
    setError('')
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        <Button startIcon={<ArrowBack />} onClick={onBack} disabled={saving} sx={{ mb: 3, textTransform: 'none' }}>
          Back to Search Reports
        </Button>
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>Edit Student</Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} action={!student && !loading ? (
                <Button color="inherit" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</Button>
              ) : undefined}>{error}</Alert>
            )}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Student updated successfully.</Alert>}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
            {student && !loading && (
              <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Full Name" required value={student.fullName} disabled={saving}
                  onChange={(event) => updateField('fullName', event.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} />
                <TextField label="Grade" select required value={student.grade} disabled={saving}
                  onChange={(event) => updateField('grade', event.target.value)}>
                  {GRADES.map((grade) => <MenuItem key={grade} value={grade}>{grade}</MenuItem>)}
                </TextField>
                <TextField label="Primary Contact Email" type="email" required value={student.contactemail1} disabled={saving}
                  onChange={(event) => updateField('contactemail1', event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField label="Secondary Contact Email" type="email" value={student.contactemail2 ?? ''} disabled={saving}
                  onChange={(event) => updateField('contactemail2', event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <Typography variant="body2" color="text.secondary">
                  Name changes also update existing reports. Existing reports keep their original grade.
                </Typography>
                <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <Save />} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
