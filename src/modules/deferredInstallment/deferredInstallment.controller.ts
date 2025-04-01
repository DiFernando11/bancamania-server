import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { UUIDDto } from '@/src/common/dto'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { PayInstallmentsDto } from '@/src/modules/deferredInstallment/dto/pay-installment.dto'
import { DeferredInstallmentService } from './deferredInstallment.service'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'
import { GenerateStatementDto } from './dto/generate-statement-credit.dto'

@Controller('deferredInstallment')
export class DeferredInstallmentController {
  constructor(
    private readonly deferredInstallmentService: DeferredInstallmentService
  ) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createDeferredPurchase(
    @Req() req,
    @Body() createDeferredPurchaseDto: CreateDeferredPurchaseDto
  ) {
    return this.deferredInstallmentService.createDeferredPurchase(
      req,
      createDeferredPurchaseDto
    )
  }

  @Post(':uuid/pay')
  @UseGuards(JwtAuthGuard)
  async payInstallmentsAmount(
    @Req() req: Request,
    @Param() params: UUIDDto,
    @Body() body: PayInstallmentsDto
  ) {
    const { uuid } = params
    const { amount } = body

    return this.deferredInstallmentService.payInstallmentsAmount(
      req,
      uuid,
      amount
    )
  }

  @Get(':uuid/pdf/statement')
  @UseGuards(JwtAuthGuard)
  async generateStatementCreditPdf(
    @Req() req,
    @Param() params: UUIDDto,
    @Query() queryParams: GenerateStatementDto,
    @Res() res: Response
  ) {
    const { uuid } = params

    const pdfBuffer =
      await this.deferredInstallmentService.generateStatementCreditPdf(
        req,
        uuid,
        queryParams
      )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=comprobante_${uuid}.pdf`
    )
    res.end(pdfBuffer)
  }

  @Get('/:uuid/mothsStatement')
  @UseGuards(JwtAuthGuard)
  async getAvailablePeriods(@Req() req: Request, @Param() params: UUIDDto) {
    const { uuid } = params
    return this.deferredInstallmentService.getAvailablePeriods(req, uuid)
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  async getPendingInstallmentsForCurrentMonth(
    @Req() req: Request,
    @Param() params: UUIDDto
  ) {
    const { uuid } = params
    return this.deferredInstallmentService.getPendingInstallmentsForCurrentMonth(
      req,
      uuid
    )
  }
}
