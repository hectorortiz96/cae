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
  title: string
  content: string
  studentName: string
  grade: string
  reportType: string
  authorUsername: string
  createdAt: string
}

// Form data types
export interface ReportFormData {
  title: string
  content: string
  studentName: string
  grade: string
  reportType: string
}

