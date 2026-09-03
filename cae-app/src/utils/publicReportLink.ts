const PUBLIC_REPORT_PATH_PREFIX = '/reports/public'

export const buildPublicReportUrl = (reportId: number) => {
  return `${window.location.origin}${PUBLIC_REPORT_PATH_PREFIX}/${reportId}`
}

export const copyPublicReportLink = async (reportId: number) => {
  const publicUrl = buildPublicReportUrl(reportId)

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(publicUrl)
    return publicUrl
  }

  const textArea = document.createElement('textarea')
  textArea.value = publicUrl
  textArea.setAttribute('readonly', 'true')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  const didCopy = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!didCopy) {
    throw new Error('Unable to copy public link automatically.')
  }

  return publicUrl
}

