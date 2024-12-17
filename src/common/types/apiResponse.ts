import { AuthRegisterLogin } from '@/src/common/types/auth'

export type ApiResponse<Data = any> = {
  data?: Data | null
  message: string
  ok: boolean
  statusCode: number
  error?: any
}

export type PromiseApiResponse<Data> = Promise<ApiResponse<Data>>

export type PromiseApiAuthResponse = Promise<ApiResponse<AuthRegisterLogin>>
