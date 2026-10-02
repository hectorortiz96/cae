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
    publicById: (id: number) => `/reports/public/${id}`,
    publicMarkReceived: (id: number) => `/reports/public/${id}/received`,
    byGrade: (grade: string) => `/reports/grade/${grade}`,
    byType: (type: string) => `/reports/type/${type}`,
    byStudent: (student: string) => `/reports/student/${encodeURIComponent(student)}`,
  },
  students: {
    base: '/students',
    import: '/students/import',
    byGrade: (grade: string) => `/students/grade/${grade}`,
    byName: (name: string) => `/students/name/${name}`,
  },
} as const
