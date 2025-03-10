import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import { Request } from 'express'
import { AccountService } from '@/src/modules/account/account.service'
import { VerifyAccountDto } from '@/src/modules/account/dto/verifyAccount.dto'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createAccount(@Req() req: Request) {
    return this.accountService.createAccount(req)
  }

  @Get('/')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getAccountUser(@Req() req: Request) {
    return this.accountService.getAccountUser(req)
  }

  @Get('/:accountNumber')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async verifyAccount(
    @Param(ValidationPipe) params: VerifyAccountDto,
    @Req() req: Request
  ) {
    return this.accountService.verifyAccount(params, req)
  }
}
