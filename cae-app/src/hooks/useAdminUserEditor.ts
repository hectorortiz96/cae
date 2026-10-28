import { useState, type FormEvent } from 'react'
import { ApiError, apiFetch } from '../api/client'
import { API_ROUTES } from '../api/routes'
import type { UserInfo } from '../types'
import { getAuthHeader } from '../utils/authUtils'

interface AdminUserEditorOptions {
  userInfo: UserInfo | null
  onUpdated: (user: UserInfo) => void
  onCurrentUserUpdated: (user: UserInfo) => void
  onLogout: () => void
}

export function useAdminUserEditor({
  userInfo,
  onUpdated,
  onCurrentUserUpdated,
  onLogout,
}: AdminUserEditorOptions) {
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [form, setForm] = useState({ username: '', fullName: '', email: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const openDialog = (user: UserInfo) => {
    setEditingUser(user)
    setForm({ username: user.username, fullName: user.fullName, email: user.email })
    setError('')
    setMessage('')
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser || saving) return

    setSaving(true)
    setError('')
    try {
      const updatedUser = await apiFetch<UserInfo>(API_ROUTES.admin.userById(editingUser.id), {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
        }),
      })

      onUpdated(updatedUser)
      if (updatedUser.id === userInfo?.id) {
        if (updatedUser.username !== userInfo.username) {
          onLogout()
          return
        }
        onCurrentUserUpdated(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        localStorage.setItem('username', updatedUser.username)
      }
      setEditingUser(null)
      setMessage('Los datos del usuario se actualizaron.')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron actualizar los datos del usuario. Inténtelo de nuevo.',
      )
    } finally {
      setSaving(false)
    }
  }

  return { editingUser, setEditingUser, form, setForm, error, message, saving, openDialog, save }
}
