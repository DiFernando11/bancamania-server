import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Response } from 'express'
import * as pdf from 'html-pdf-node'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly i18n: I18nService
  ) {}

  async generatePdfBuffer(htmlContent: string): Promise<Buffer> {
    const options = { format: 'A4' }
    const file = { content: htmlContent }

    try {
      return await pdf.generatePdf(file, options)
    } catch (error) {
      throw new Error(`Error al generar el PDF: ${error.message}`)
    }
  }
}
