import { ClientUser } from '@/src/common/types/user'

export interface AuthRegisterLogin {
  token: string
  user: ClientUser
}
