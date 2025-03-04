import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import {
  createFilterDate,
  createPaginationData,
  getTranslation,
  HttpResponseSuccess,
} from '@/src/common/utils'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { Receipt } from '@/src/modules/receipts/receipts.entity'

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly i18n: I18nService,
    private readonly pdfService: PdfService
  ) {}

  async createReceipt({
    user,
    title,
    description,
    dataReceipts,
  }: {
    user
    title: string
    description: string
    dataReceipts: { key: string; value: string | number }[]
  }): Promise<Receipt> {
    const receipt = this.receiptRepository.create({
      dataReceipts,
      description,
      title,
      user,
    })

    return await this.receiptRepository.save(receipt)
  }

  async getPreviewReceipts(
    req,
    limit,
    page,
    fechaDesde?: string,
    fechaHasta?: string
  ) {
    const filters: any = {
      user: { id: req.user.id },
      ...createFilterDate(fechaDesde, fechaHasta),
    }

    const { skip, take, createResponse } = createPaginationData({
      limit,
      page,
    })

    const [receipts, total] = await this.receiptRepository.findAndCount({
      order: {
        createdAt: 'DESC',
      },
      skip,
      take,
      where: filters,
    })

    const translatedReceipt = receipts.map((receipt) => {
      return {
        ...receipt,
        description: getTranslation({
          description: receipt.description,
          i18n: this.i18n,
        }),
      }
    })

    return HttpResponseSuccess(null, {
      ...createResponse(total),
      receipts: translatedReceipt,
    })
  }
}
