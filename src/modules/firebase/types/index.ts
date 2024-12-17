type Feature = 'registerCredentials' | 'authPhone'
export interface CodeDocument {
  expireAt: {
    seconds: number
    nanoseconds: number
  }
  code: string
  createdAt: Date
  isValidatedCode: false
}

export interface CodeDocumentResponse extends CodeDocument {
  id: string
}

export interface CreateCode {
  data: any
  feature: Feature
}

export interface VerifyCode extends CreateCode {
  code: string
}
