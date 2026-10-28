import type { Report } from '../types'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatDate = (value: string | null) =>
  value === null ? '' : dateFormatter.format(new Date(value))

const escapeCell = (value: string | number | null) => {
  const text = value === null ? '' : String(value)
  // Quoting alone does not prevent spreadsheet formulas in user-entered text.
  const safeText = /^(?:\s*[=+\-@]|[\t\r\n])/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

export const createReportsCsv = (reports: readonly Report[]) => {
  const headers = [
    'Alumno',
    'Grado',
    'Tipo de incidencia',
    'Docente',
    'Fecha de creaci\u00f3n',
    'Descripci\u00f3n',
    'Recibida',
    'Fecha de recepci\u00f3n',
  ]
  const rows = reports.map((report) => [
    report.student,
    report.grade,
    report.reportType,
    report.authorFullName,
    formatDate(report.createdAt),
    report.content,
    report.received ? 'S\u00ed' : 'No',
    formatDate(report.reportReceivedDate),
  ])

  return '\uFEFF' + [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n') + '\r\n'
}

export const downloadReportsCsv = (reports: readonly Report[]) => {
  const blob = new Blob([createReportsCsv(reports)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `incidencias-${new Date().toISOString().slice(0, 10)}.csv`

  try {
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    // Let the browser start the download before releasing the URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
