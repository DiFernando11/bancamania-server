import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'

export interface Movements {
  id: number
  balance?: number
  totalBalance: number
  title: string
  description: string
  typeMovement: TypeMovement
  createdAt: Date
}

export interface GetUserMovementsResponse {
  currentPage: number
  isLastPage: boolean
  nextCursor: number | null
  prevCursor: number | null
  totalItems: number
  totalPages: number
  movements: Movements[]
}
