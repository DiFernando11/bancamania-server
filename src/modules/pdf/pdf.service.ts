import { Injectable } from '@nestjs/common'
import * as pdf from 'html-pdf-node'

@Injectable()
export class PdfService {
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
