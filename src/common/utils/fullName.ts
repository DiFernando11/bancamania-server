import { Usuario } from '@/src/modules/users/users.entity'

export const fullName = (user: Usuario) => {
  return `${user.first_name} ${user.last_name}`
}
