import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AccountService } from '@/src/modules/account/account.service'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createAccount(@Req() req: Request) {
    return this.accountService.createAccount(req)
  }
}
