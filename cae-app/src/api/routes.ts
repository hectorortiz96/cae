export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
  },
  users: {
    me: '/users/me',
  },
  reports: {
    base: '/reports',
    me: '/reports/me',
    byId: (id: number) => `/reports/${id}`,
    byGrade: (grade: string) => `/reports/grade/${grade}`,
    byType: (type: string) => `/reports/type/${type}`,
    byStudent: (name: string) => `/reports/student/${name}`,
    search: '/reports/search',
  },
} as const

