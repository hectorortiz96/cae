import { TablePagination } from '@mui/material'
import { PAGE_SIZE } from '../hooks/usePagination'

interface TablePaginationControlsProps {
  count: number
  page: number
  onPageChange: (page: number) => void
}

export default function TablePaginationControls({ count, page, onPageChange }: TablePaginationControlsProps) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      rowsPerPage={PAGE_SIZE}
      rowsPerPageOptions={[PAGE_SIZE]}
      onPageChange={(_, nextPage) => onPageChange(nextPage)}
      labelDisplayedRows={({ from, to, count: total }) => `${from}-${to} de ${total}`}
      getItemAriaLabel={(type) => ({
        first: 'Primera página',
        last: 'Última página',
        next: 'Página siguiente',
        previous: 'Página anterior',
      })[type]}
      sx={{
        mt: 1,
        '& .MuiTablePagination-toolbar': { px: { xs: 0, sm: 2 }, flexWrap: 'wrap' },
        '& .MuiTablePagination-actions': { ml: { xs: 1, sm: 2.5 } },
      }}
    />
  )
}
