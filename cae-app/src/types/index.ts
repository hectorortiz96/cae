// User types
export interface UserInfo {
  id: number
  username: string
  email: string
  fullName: string
  role: string
  createdAt: string
  updatedAt: string
}

// Report types
export interface Report {
  id: number
  content: string
  studentName: string
  grade: string
  reportType: string
  authorUsername: string
  createdAt: string
}

export type ReportPdfFieldKey =
  | 'id'
  | 'studentName'
  | 'grade'
  | 'reportType'
  | 'authorUsername'
  | 'createdAt'
  | 'content'

export interface ReportPdfExportOptions {
  includeFields?: ReportPdfFieldKey[]
  title?: string
  locale?: string
}

// Form data types
export interface ReportFormData {
  content: string
  studentName: string
  grade: string
  reportType: string
}

