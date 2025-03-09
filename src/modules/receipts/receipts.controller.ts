import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { ReceiptPdfDto } from '@/src/modules/receipts/dtos/generateReceipts.dto'
import { GetPreviewReceiptsDto } from '@/src/modules/receipts/dtos/get-preview-receipts.dto'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUserMovements(
    @Req() req: Request,
    @Query() query: GetPreviewReceiptsDto
  ) {
    return this.receiptsService.getPreviewReceipts(
      req,
      query.limit,
      query.page,
      query.fechaDesde,
      query.fechaHasta
    )
  }
  @Get('/:uuid')
  @UseGuards(JwtAuthGuard)
  async getReceiptByUUID(@Req() req: Request, @Param() params: ReceiptPdfDto) {
    const { uuid } = params
    return this.receiptsService.getReceiptByUUID(uuid, req)
  }

  @Get('/pdf/:uuid')
  @UseGuards(JwtAuthGuard)
  async getReceiptPdf(
    @Req() req: Request,
    @Param() params: ReceiptPdfDto,
    @Res() res: Response
  ) {
    const { uuid } = params
    const pdfBuffer = await this.receiptsService.generateReceiptPdf(uuid, req)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=comprobante_${uuid}.pdf`
    )
    res.end(pdfBuffer)
  }
}
