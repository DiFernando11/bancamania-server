import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
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
}
