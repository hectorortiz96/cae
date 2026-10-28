import { useState, type FormEvent } from 'react'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import type { UserInfo } from '../types'
import { getAuthHeader } from '../utils/authUtils'

export function useProfileEditor(userInfo: UserInfo | null, onUpdated: (user: UserInfo) => void) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const openDialog = () => {
    if (!userInfo) return
    setUsername(userInfo.username)
    setFullName(userInfo.fullName)
    setError('')
    setOpen(true)
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userInfo) return

    setSaving(true)
    setError('')
    try {
      const response = await apiFetch<{
        token: string
        expiresIn: number
        user: UserInfo
      }>(API_ROUTES.users.updateMe, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ username, fullName }),
      })

      localStorage.setItem('token', response.token)
      localStorage.setItem('expiresIn', String(response.expiresIn))
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('username', response.user.username)
      onUpdated(response.user)
      setOpen(false)
    } catch (profileErr) {
      setError(
        profileErr instanceof ApiError
          ? profileErr.message
          : 'No se pudieron actualizar sus datos. Inténtelo de nuevo.',
      )
    } finally {
      setSaving(false)
    }
  }

  return { open, setOpen, username, setUsername, fullName, setFullName, error, saving, openDialog, save }
}
