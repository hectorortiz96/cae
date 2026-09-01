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
 * Check if user is authenticated (token exists)
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token')
  return !!token
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
 * Get token expiration time (in milliseconds)
 */
export const getTokenExpiration = (): number | null => {
  const expiresIn = localStorage.getItem('expiresIn')
  return expiresIn ? parseInt(expiresIn, 10) : null
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

