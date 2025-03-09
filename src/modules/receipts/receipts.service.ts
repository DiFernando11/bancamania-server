import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  createFilterDate,
  createPaginationData,
  formatDateReplace,
  getTranslation,
  HttpResponseSuccess,
  ThrowHttpException,
} from '@/src/common/utils'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { htmlTemplate, receiptsTemplate } from '@/src/modules/pdf/template'
import { receipts } from '@/src/modules/pdf/template/css'
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
        title: this.i18n.t(`receipts.${receipt.title}`),
      }
    })

    return HttpResponseSuccess(null, {
      ...createResponse(total),
      receipts: translatedReceipt,
    })
  }
  async getReceiptByUUID(uuid: string, req) {
    const receipt = await this.receiptRepository.findOne({
      select: ['id', 'title', 'dataReceipts', 'createdAt'],
      where: { id: uuid, user: { id: req.user.id } },
    })

    if (!receipt) {
      ThrowHttpException(
        this.i18n.t('receipts.NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const translatedReceipt = {
      ...receipt,
      createdAt: formatDateReplace(receipt.createdAt, 'dd MMMM yyyy'),
      dataReceipts: receipt.dataReceipts.map((receiptData) => ({
        key: `${getTranslation({
          description: `receipts.${receiptData.key}`,
          i18n: this.i18n,
        })}${receiptData?.value ? ':' : ''} `,
        style: receiptData?.style,
        value: receiptData?.value,
      })),
      title: this.i18n.t(`receipts.${receipt.title}`),
    }

    return HttpResponseSuccess(
      this.i18n.t('general.GET_SUCCESS'),
      translatedReceipt
    )
  }

  async generateReceiptPdf(uuid: string, req) {
    const { data } = await this.getReceiptByUUID(uuid, req)

    const { title, dataReceipts, createdAt, id } = data

    const htmlContent = htmlTemplate({
      content: receiptsTemplate({
        createdAt: this.i18n.t('receipts.date', { args: { date: createdAt } }),
        dataReceipts,
        receiptID: `${this.i18n.t('receipts.receipt', { args: { rec: id } })}`,
        title,
      }),
      style: receipts,
    })
    return await this.pdfService.generatePdfBuffer(htmlContent)
  }
}
