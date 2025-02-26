export interface ServerUser {
  id: string
  email?: string
  authMethods?: string[]
  password?: string
  image?: string
  first_name?: string
  last_name?: string
  address?: string
  phone_number?: string
}

export interface ClientUser {
  email: string
  firstName?: string
  image?: string
  lastName?: string
  phone?: string
  id: number
}
