import { Usuario } from '@/src/modules/users/users.entity'

export const fullName = (user: Usuario) => {
  return `${user.last_name} ${user.first_name}`
}
