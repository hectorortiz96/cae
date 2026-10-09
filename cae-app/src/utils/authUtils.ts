/**
 * Authentication Utilities
 * Helper functions to manage user authentication and authorization

 * import {
 *   isAuthenticated,      // Check if user is logged in
 *   getToken,             // Get JWT token
 *   getUser,              // Get full user object
 *   getUserRole,          // Get user's role
 *   isAdmin,              // Check if user is admin
 *   getUsername,          // Get username
 *   getAuthHeader,        // Get Authorization header for API calls
 *   logout                // Clear all auth data
 * } from '@/utils/authUtils'
 */
interface StoredUser {
  id: number
  username: string
  email: string
  fullName: string
  role?: string
}

/**
 * Check if the stored JWT has not expired
 */
export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token) return false

  const expiration = getTokenExpiration()
  if (expiration === null || Date.now() >= expiration) {
    logout()
    return false
  }

  return true
}

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

/**
 * Get stored user data
 */
export const getUser = (): StoredUser | null => {
  const userJson = localStorage.getItem('user')
  if (!userJson) return null
  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  return localStorage.getItem('userRole')
}

/**
 * Get user ID
 */
export const getUserId = (): string | null => {
  return localStorage.getItem('userId')
}

/**
 * Get username
 */
export const getUsername = (): string | null => {
  return localStorage.getItem('username')
}

/**
 * Check if user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const userRole = getUserRole()
  return userRole === role
}

/**
 * Check if user is an admin
 */
export const isAdmin = (): boolean => {
  return hasRole('ADMIN')
}

/**
 * Get the JWT expiration timestamp (in milliseconds)
 */
export const getTokenExpiration = (): number | null => {
  const token = getToken()
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3 || !parts[1]) return null

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims: unknown = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
    if (typeof claims !== 'object' || claims === null || !('exp' in claims)) return null

    return typeof claims.exp === 'number' && Number.isFinite(claims.exp * 1000)
      ? claims.exp * 1000
      : null
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof DOMException) return null
    throw error
  }
}

/**
 * Logout - Clear all authentication data
 */
export const logout = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('expiresIn')
  localStorage.removeItem('user')
  localStorage.removeItem('userId')
  localStorage.removeItem('username')
  localStorage.removeItem('userRole')
  console.log('User logged out and localStorage cleared')
}

/**
 * Get authorization header for API requests
 * Use this when making authenticated API calls
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
  }
}
