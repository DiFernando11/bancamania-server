import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
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
}
