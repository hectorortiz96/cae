import { useState } from 'react'

export const PAGE_SIZE = 20

export function usePagination<T>(items: readonly T[]) {
  const [requestedPage, setPage] = useState(0)
  const page = Math.min(requestedPage, Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1))

  return {
    page,
    setPage,
    paginatedItems: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
  }
}
