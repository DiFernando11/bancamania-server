import { User } from '@/src/modules/users/users.interface'

export interface Phone {
  phone: string
}

export interface SendCodeToPhone extends Phone {
  code: string
}

export interface RegisterWithPhoneGoogle extends Phone {
  idToken: string
}

export interface ValidateCode {
  token: string
  isUserRegistered: boolean
  user: User
}
