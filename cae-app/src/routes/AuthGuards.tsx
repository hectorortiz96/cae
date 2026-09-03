import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/authUtils'

export const RequireAuth = ({ children }: { children: ReactElement }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const AnonymousOnly = ({ children }: { children: ReactElement }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

