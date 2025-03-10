import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { ContactAccountsService } from '@/src/modules/contacts/contactAccounts..service'
import { CreateContactAccountDto } from '@/src/modules/contacts/dto/createContactAccount.dto'

@Controller('contacts')
export class ContactAccountController {
  constructor(
    private readonly contactAccountsService: ContactAccountsService
  ) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createContactAccount(
    @Req() req,
    @Body() createContactAccountDto: CreateContactAccountDto
  ) {
    return this.contactAccountsService.createContactAccount(
      req,
      createContactAccountDto
    )
  }
}
