import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { UUIDDto } from '@/src/common/dto'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { DeferredInstallmentService } from './deferredInstallment.service'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'

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

  @Get('/:uuid')
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
