export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    me: '/users/me',
  },
  admin: {
    users: '/admin/users',
    userById: (id: number) => `/admin/users/${id}`,
    userReports: (id: number) => `/admin/users/${id}/reports`,
  },
  reports: {
    base: '/reports',
    me: '/reports/me',
    searchByStudent: (studentName: string) => `/reports/search?studentName=${encodeURIComponent(studentName)}`,
    byId: (id: number) => `/reports/${id}`,
    resendEmail: (id: number) => `/reports/${id}/resend-email`,
    publicById: (id: number) => `/reports/public/${id}`,
    publicMarkReceived: (id: number) => `/reports/public/${id}/received`,
    byGrade: (grade: string) => `/reports/grade/${grade}`,
    byType: (type: string) => `/reports/type/${type}`,
    byStudent: (student: string) => `/reports/student/${encodeURIComponent(student)}`,
  },
  students: {
    base: '/students',
    details: (fullName: string) => `/students/details?fullName=${encodeURIComponent(fullName)}`,
    update: (contactemail1: string) => `/students/details?contactemail1=${encodeURIComponent(contactemail1)}`,
    import: '/students/import',
    byGrade: (grade: string) => `/students/grade/${grade}`,
    byName: (name: string) => `/students/name/${name}`,
  },
} as const
