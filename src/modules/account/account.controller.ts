import { Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AccountService } from '@/src/modules/account/account.service'
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
}
