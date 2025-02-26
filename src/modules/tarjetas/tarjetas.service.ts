import { Injectable } from '@nestjs/common'

@Injectable()
export class TarjetasService {
  constructor() {}

  generateExpirationDate(): string {
    const date = new Date()
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getFullYear() + 20) % 100}`
  }

  generateCVV(): string {
    return Math.floor(100 + Math.random() * 900).toString()
  }
}
