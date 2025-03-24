import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { DeferredInstallmentService } from './deferredInstallment.service'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'

@Controller('deferredIntallment')
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
}
