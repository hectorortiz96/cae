import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { Image } from '@react-pdf/renderer'
import type { Report, ReportPdfExportOptions } from '../types'
import { getUser } from './authUtils'
import logoImage from '../assets/cae_logo.png'

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
  text: {
    margin: 10,
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
  reportType,
  student,
  grade,
  authorName,
  createdAt,
  content,
}: {
  reportType: string
  student: string
  grade: string
  authorName: string
  createdAt: string
  content: string
}) {
  const generatedAt = formatDate(new Date().toISOString())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.contentFrame}>
          <Image src={logoImage} style={styles.logo} />
          <Text style={styles.title}>{"Colegio Anglo Español"}</Text>
          <Text style={styles.title}>{"Secundaria"}</Text>
          <Text style={styles.title}>{reportType}</Text>

          <Text style={styles.text}>
            Por este medio se les notifica que su hijo(a) <Text style={styles.fieldValue}>{student}</Text>
            &nbsp;en grado <Text style={styles.fieldValue}>{grade}</Text> muestra una actitud inapropiada en ciertas
            normas de convivencia descrito a continuacion:
          </Text>

          <Text style={styles.contentBox}>{content}</Text>

          <Text style={styles.text}>
            Este documento deberá ser regresado <Text style={styles.fieldValue}>al día siguiente </Text> por medio
            del alumno(a) a su maestro(a), con la FIRMA DE ENTERADOS de sus padres.
          </Text>

          <Text style={styles.disclaimer}>
            Agradecemos su apoyo que favorecerá la responsabilidad y sana convivencia de nuestros alumnos.
            Dialoguen en familia
          </Text>

          <Text style={styles.warning}>
            3 Observaciones amerita 1 reporte disciplinario
          </Text>

          <Text style={styles.text}>
            Nombre del maestro(a): <Text style={styles.fieldValue}>{authorName}</Text>
          </Text>

          <Text style={styles.fieldValue}>{createdAt}</Text>
          <Text style={styles.date}>Generated at {generatedAt}</Text>

        </View>
      </Page>
    </Document>
  )
}

export async function exportReportToPdf(report: Report, _options: ReportPdfExportOptions = {}) {
  const currentUserFullName = getUser()?.fullName?.trim() || report.authorUsername

  const pdfInstance = pdf()
  pdfInstance.updateContainer(
    <ReportPdfDocument
      reportType={report.reportType}
      student={report.student}
      grade={report.grade}
      authorName={currentUserFullName}
      createdAt={formatDate(report.createdAt)}
      content={report.content || 'No content provided.'}
    />,
  )
  const createBlob = pdfInstance.toBlob as unknown as () => Promise<Blob>
  const blob = await createBlob()
  const fileName = sanitizeFileName(`report-${report.id}.pdf`)
  triggerBlobDownload(blob, fileName)
}



