import { Controller, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { DebitCardService } from '@/src/modules/tarjetas/debitCard/debitCard.service'

@Controller('cards')
export class DebitCardController {
  constructor(private readonly debitCardService: DebitCardService) {}
  @Post('/debit')
  @UseGuards(JwtAuthGuard)
  async createAccount(@Req() req: Request) {
    return this.debitCardService.createDebitCard(req)
  }
}
