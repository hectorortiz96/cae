import { useRef, useState, type ChangeEvent } from 'react'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import type { StudentBatchImportResponse } from '../types'
import { getAuthHeader } from '../utils/authUtils'

export function useStudentActions() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importSummary, setImportSummary] = useState<StudentBatchImportResponse | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showImportInfoDialog, setShowImportInfoDialog] = useState(false)
  const [showDeleteWarningDialog, setShowDeleteWarningDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const chooseImportFile = () => {
    if (importing || deleting) {
      return
    }
    setShowImportInfoDialog(true)
  }

  const confirmImportDialog = () => {
    setShowImportInfoDialog(false)
    fileInputRef.current?.click()
  }

  const importStudents = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    setMessage('')
    setError('')
    setImportSummary(null)
    setImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await apiFetch<StudentBatchImportResponse>(API_ROUTES.students.import, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      })

      setImportSummary(response)
      setMessage('La importación de alumnos se completó.')
    } catch (importErr) {
      if (importErr instanceof ApiError) {
        setError(importErr.message)
      } else {
        setError('No se pudieron importar los alumnos. Inténtelo de nuevo.')
      }
    } finally {
      setImporting(false)
    }
  }

  const confirmDeleteAll = () => {
    if (importing || deleting) {
      return
    }
    setShowDeleteWarningDialog(true)
  }

  const deleteAllStudents = async () => {
    setShowDeleteWarningDialog(false)
    setMessage('')
    setError('')
    setImportSummary(null)
    setDeleting(true)

    try {
      await apiFetch<null>(API_ROUTES.students.base, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      setMessage('Se eliminaron todos los registros de alumnos.')
    } catch (deleteErr) {
      if (deleteErr instanceof ApiError) {
        setError(deleteErr.message)
      } else {
        setError('No se pudieron eliminar los registros de alumnos. Inténtelo de nuevo.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return {
    message,
    error,
    importSummary,
    importing,
    deleting,
    showImportInfoDialog,
    setShowImportInfoDialog,
    showDeleteWarningDialog,
    setShowDeleteWarningDialog,
    fileInputRef,
    chooseImportFile,
    confirmImportDialog,
    importStudents,
    confirmDeleteAll,
    deleteAllStudents,
  }
}
