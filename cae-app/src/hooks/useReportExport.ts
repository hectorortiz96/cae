import { useState } from 'react'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import type { Report } from '../types'
import { getAuthHeader } from '../utils/authUtils'
import { downloadReportsCsv } from '../utils/reportCsvExport'

export function useReportExport(onSessionExpired: () => void) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const exportAllReports = async () => {
    setExporting(true)
    setError('')
    setMessage('')

    try {
      const allReports = await apiFetch<Report[]>(API_ROUTES.reports.base, {
        headers: getAuthHeader(),
      })

      if (allReports.length === 0) {
        setMessage('No hay incidencias para exportar.')
        return
      }

      downloadReportsCsv(allReports)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired()
        return
      }
      setError(
        err instanceof ApiError
          ? err.status === 403
            ? 'No tiene permiso para exportar las incidencias.'
            : err.message
          : 'No se pudieron exportar las incidencias. Inténtelo de nuevo.',
      )
    } finally {
      setExporting(false)
    }
  }

  return { exporting, error, message, exportAllReports }
}
