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
    byStudent: (name: string) => `/reports/student/${name}`,
  },
} as const

