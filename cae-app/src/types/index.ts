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

export type Grade = '1A' | '1B' | '1C' | '2A' | '2B' | '2C' | '3A' | '3B' | '3C'

export interface Student {
  fullName: string
  grade: Grade
  contactemail1: string
  contactemail2?: string | null
}

// Report types
export interface Report {
  id: number
  content: string
  student: string
  grade: Grade
  reportType: string
  authorUsername: string
  createdAt: string
}

export type ReportPdfFieldKey =
  | 'id'
  | 'student'
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
  student: string
  grade: string
  reportType: string
}

export interface StudentBatchImportRowError {
  row: number
  message: string
}

export interface StudentBatchImportResponse {
  totalRows: number
  createdRows: number
  failedRows: number
  errors: StudentBatchImportRowError[]
}

