import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { TransferDto } from '@/src/modules/transfers/dto/createTransfer.dto'
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
}
