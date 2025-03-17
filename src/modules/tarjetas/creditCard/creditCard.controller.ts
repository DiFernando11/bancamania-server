import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { CreditCardService } from '@/src/modules/tarjetas/creditCard/creditCard.service'
import { CreateCreditCardDto } from '@/src/modules/tarjetas/creditCard/dto/createCreditCard.dto'

@Controller('cards')
export class CreditCardController {
  constructor(private readonly creditCardService: CreditCardService) {}

  @Post('/credit')
  @UseGuards(JwtAuthGuard)
  async createCreditCard(
    @Req() req,
    @Body() createCreditCardDto: CreateCreditCardDto
  ) {
    return this.creditCardService.createCreditCard(
      req,
      createCreditCardDto.marca
    )
  }

  @Get('/credit')
  @UseGuards(JwtAuthGuard)
  async getUserCreditCards(@Req() req) {
    return this.creditCardService.getUserCreditCards(req)
  }

  @Get('/credit/offerts')
  @UseGuards(JwtAuthGuard)
  async getOffertCredit(@Req() req) {
    return this.creditCardService.getOffertCredit(req)
  }
}
