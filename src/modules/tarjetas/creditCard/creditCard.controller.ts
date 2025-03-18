import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { CreditCardService } from '@/src/modules/tarjetas/creditCard/creditCard.service'
import { CreateCreditCardDto } from '@/src/modules/tarjetas/creditCard/dto/createCreditCard.dto'
import { GetCardCreditDto } from '@/src/modules/tarjetas/creditCard/dto/getCreditCard.dto'

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

  @Put('/credit/version/receipt/:uuid')
  @UseGuards(JwtAuthGuard)
  async createReceiptUpdgradeVersion(
    @Req() req: Request,
    @Param() params: GetCardCreditDto
  ) {
    return this.creditCardService.createReceiptUpdgradeVersion(req, params.uuid)
  }

  @Put('/credit/status/:uuid')
  @UseGuards(JwtAuthGuard)
  async updateCreditCardStatus(
    @Req() req: Request,
    @Param() params: GetCardCreditDto
  ) {
    return this.creditCardService.updateCreditCardStatus(req, params.uuid)
  }

  @Put('/credit/version/:uuid')
  @UseGuards(JwtAuthGuard)
  async upgradeCreditCardVersion(
    @Req() req: Request,
    @Param() params: GetCardCreditDto
  ) {
    return this.creditCardService.upgradeCreditCardVersion(req, params.uuid)
  }

  @Get('/credit/:uuid')
  @UseGuards(JwtAuthGuard)
  async getCardCreditByUUID(
    @Req() req: Request,
    @Param() params: GetCardCreditDto
  ) {
    return this.creditCardService.getCardCreditByUUID(req, params.uuid)
  }
}
