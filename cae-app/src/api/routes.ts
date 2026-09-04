export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
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
    byId: (id: number) => `/reports/${id}`,
    publicById: (id: number) => `/reports/public/${id}`,
    byGrade: (grade: string) => `/reports/grade/${grade}`,
    byType: (type: string) => `/reports/type/${type}`,
    byStudent: (student: string) => `/reports/student/${student}`,
  },
  students: {
    base: '/students',
    import: '/students/import',
    byGrade: (grade: string) => `/students/grade/${grade}`,
    byName: (name: string) => `/students/name/${name}`,
  },
} as const

