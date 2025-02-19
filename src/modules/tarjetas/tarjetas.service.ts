import { Injectable } from '@nestjs/common'

@Injectable()
export class TarjetasService {
  constructor() {}

  generateCardNumber(): string {
    return Array(16)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join('')
  }

  generateExpirationDate(): string {
    const date = new Date()
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getFullYear() + 20) % 100}`
  }

  generateCVV(): string {
    return Math.floor(100 + Math.random() * 900).toString()
  }
}
