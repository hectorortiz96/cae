import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { Image } from '@react-pdf/renderer'
import type { Report, ReportPdfExportOptions } from '../types'
import { getUser } from './authUtils'
import logoImage from '../assets/cae_logo.png'

interface ReportPdfFile {
  blob: Blob
  fileName: string
  mimeType: string
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 100,
    paddingBottom: 65,
    paddingHorizontal: 40,
    fontSize: 11,
    color: '#1f2937',
    lineHeight: 1.45,

  },
  contentFrame: {
    flexGrow: 1,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 18,
  },
  title: {
    textTransform: 'uppercase',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 16,
  },
  disclaimer: {
    textAlign: 'center',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  warning: {
    textTransform: 'uppercase',
    fontWeight: "bold",
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 8,
    color: '#111827',
  },
  warningSmall: {
    textTransform: 'uppercase',
    fontWeight: "bold",
    color: '#111827',
  },
  text: {
    margin: 10,
  },
  reportTypeNotice: {
    marginHorizontal: 10,
    marginBottom: 12,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  contentBox: {
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#000000',
    padding: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldValue: {
    fontWeight: "bold",
  },
  date: {
    marginTop: 'auto',
    textAlign: 'center',
  },
  logo: {
    width: 50,
    height: 60,
    position: 'absolute',
    top: 18,
    left: 18,
  },
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}



function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[\\/:*?"<>|]+/g, '-').trim()
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function ReportPdfDocument({
  reportType, student, grade, authorName, createdAt, content, schoolCycle
}: {
  reportType: string
  student: string
  grade: string
  authorName: string
  createdAt: string
  content: string
  schoolCycle: string
}) {

  if (reportType === 'Observación') {
    return (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.contentFrame}>
              <Image src={logoImage} style={styles.logo} />
              <Text style={styles.title}>Colegio Anglo Español</Text>
              <Text style={styles.title}>Secundaria</Text>
              <Text style={styles.title}>OBSERVACIÓN DISCIPLINARIA</Text>

              <Text style={styles.text}>Fecha de reporte: {createdAt}</Text>

              <Text style={styles.text}>
                Por este medio se les notifica que su hijo(a) <Text style={styles.fieldValue}>{student}</Text> en grado{' '}
                <Text style={styles.fieldValue}>{grade}</Text> Muestra una actitud inapropiada en ciertas Normas de
                Convivencia y/o incumplimiento en su desempeño académico descrito a continuación:
              </Text>

              <Text style={styles.contentBox}>{content}</Text>

              <Text style={styles.text}>
                Este documento deberá ser regresado <Text style={styles.fieldValue}>al día siguiente </Text> por medio
                del alumno(a) a su maestro(a), con la FIRMA DE ENTERADOS de sus padres.
              </Text>
              <Text style={styles.reportTypeNotice}>
                La conducta tiene un valor del 10% en la calificacion de cada materia.
              </Text>

              <Text style={styles.warning}>
                3 OBSERVACIONES ACUMULADAS POR CUALQUIER CAUSA SE CONVIERTEN EN 1 REPORTE DISCIPLINARIO.
              </Text>
              <Text style={styles.text}>
                Se aplicarian las Medidas Disciplinarias del Articulo 36 del Reglamento de Disciplina Escolar de la SEP.
              </Text>
              <Text style={styles.disclaimer}>
                AGRADECEMOS SU APOYO QUE FAVORECERÁ LA RESPONSABILIDAD
                Y SANA CONVIVENCIA DE NUESTROS ALUMNOS. DIALOGUEN EN FAMILIA.
              </Text>

              <Text style={styles.text}>
                Nombre del maestro(a): <Text style={styles.fieldValue}>{authorName}</Text>
              </Text>

              <Text style={styles.date}>{schoolCycle}</Text>

            </View>
          </Page>
        </Document>
    )
  }
  else if (reportType === 'Reporte') {
    return (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.contentFrame}>
              <Image src={logoImage} style={styles.logo} />
              <Text style={styles.title}>Colegio Anglo Español</Text>
              <Text style={styles.title}>Secundaria</Text>
              <Text style={styles.title}>REPORTE DISCIPLINARIO</Text>

              <Text style={styles.text}>Fecha de reporte: {createdAt}</Text>

              <Text style={styles.text}>
                Por este medio se les notifica que su hijo(a) <Text style={styles.fieldValue}>{student}</Text> en grado{' '}
                <Text style={styles.fieldValue}>{grade}</Text> ha incurrido en la siguiente falta a las Normas de Convivencia:
              </Text>

              <Text style={styles.contentBox}>{content}</Text>

              <Text style={styles.text}>
                Favor de confirmar para <Text style={styles.fieldValue}>el día siguiente </Text> por medio
                de nuestro portal para confirmar su recepción. Se les ha mandado un correo electrónico con el enlace para confirmar la recepción de este reporte.
              </Text>
              <Text style={styles.reportTypeNotice}>
                La conducta tiene un valor del 10% en la calificacion de cada materia.
              </Text>

              <Text style={styles.text}>
                <Text style={styles.warningSmall}>3 REPORTES ACUMULADOS:</Text> Aplica asignación de actividades
                académicas adicionales bajo supervisión fuera del grupo, en horario escolar o extraescolar, de 1 a 10 días,
                según lo establecido en las Medidas Disciplinarias del Artículo 36 del Reglamento de Disciplina Escolar de la SEP,
                se aplica dependiendo de la gravedad de la acción.
              </Text>
              <Text style={styles.disclaimer}>
                AGRADECEMOS SU APOYO Y EL QUE NOS PERMITAN SER PARTÍCIPES EN LA
                FORMACIÓN DE SU HIJO(A). DIALOGUEN EN FAMILIA.
              </Text>

              <Text style={styles.text}>
                Nombre del maestro(a): <Text style={styles.fieldValue}>{authorName}</Text>
              </Text>

              <Text style={styles.date}>{schoolCycle}</Text>

            </View>
          </Page>
        </Document>
    )
  }
  else return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.contentFrame}>
          </View>
        </Page>
      </Document>
    )
}

export async function exportReportToPdf(report: Report, _options: ReportPdfExportOptions = {}) {
  const { blob, fileName } = await buildReportPdfFile(report)
  triggerBlobDownload(blob, fileName)
}

export async function buildReportPdfFile(report: Report, fileNameOverride?: string): Promise<ReportPdfFile> {
  const currentUserFullName = getUser()?.fullName?.trim() || report.authorFullName || 'unknown'

  const date = new Date(report.createdAt)
  const year = date.getFullYear()
  const hasStarted = date.getMonth() > 7 || (date.getMonth() === 7 && date.getDate() >= 31)
  const startYear = hasStarted ? year : year - 1

  const schoolCycle = `Ciclo Escolar ${startYear}-${startYear + 1}`

  const pdfInstance = pdf()
  pdfInstance.updateContainer(
    <ReportPdfDocument
      reportType={report.reportType}
      student={report.student}
      grade={report.grade}
      authorName={currentUserFullName}
      createdAt={formatDate(report.createdAt)}
      content={report.content || 'No content provided.'}
      schoolCycle={schoolCycle}
    />,
  )

  const createBlob = pdfInstance.toBlob as unknown as () => Promise<Blob>
  const blob = await createBlob()
  const fileName = sanitizeFileName(fileNameOverride || `report-${report.id}.pdf`)

  return {
    blob,
    fileName,
    mimeType: blob.type || 'application/pdf',
  }
}



