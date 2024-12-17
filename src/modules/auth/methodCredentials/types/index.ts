export interface Email {
  email: string
}

export interface SendCodeRegister {
  firstName: string
  lastName: string
}

export interface RegisterCredentials extends SendCodeRegister {
  email: string
  password: string
  code: string
}

export interface LoginCredentials {
  email: string
  password: string
}
