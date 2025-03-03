import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { TransferDto } from '@/src/modules/transfers/dto/createTransfer.dto'
import { VerifyAccountDto } from '@/src/modules/transfers/dto/verifyAccount.dto'
import { TransfersService } from '@/src/modules/transfers/transfers.service'

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('/')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createTransfer(@Req() req: Request, @Body() transferDto: TransferDto) {
    return this.transfersService.transferFunds(req, transferDto)
  }
  @Get('/verifyAccount')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async verifyAccount(@Query(ValidationPipe) query: VerifyAccountDto) {
    return this.transfersService.verifyAccount(query)
  }
}
