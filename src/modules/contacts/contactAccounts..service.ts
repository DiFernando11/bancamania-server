import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { ILike, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  createPaginationData,
  HttpResponseSuccess,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { Account } from '@/src/modules/account/account.entity'
import { ContactAccount } from '@/src/modules/contacts/contactAccounts.entity'
import { CreateContactAccountDto } from '@/src/modules/contacts/dto/createContactAccount.dto'

@Injectable()
export class ContactAccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(ContactAccount)
    private readonly contactAccountRepository: Repository<ContactAccount>,
    private readonly i18n: I18nService
  ) {}

  async createContactAccount(
    req,
    createContactAccountDto: CreateContactAccountDto
  ) {
    const { accountId, alias } = createContactAccountDto
    const account = await this.accountRepository.findOne({
      relations: [EntitiesType.USER],
      where: { id: accountId },
    })

    if (!account) {
      ThrowHttpException(
        this.i18n.t('account.ACOUNT_ID_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    if (account.user.id === req.user.id) {
      ThrowHttpException(
        this.i18n.t('contact.SELF_EMPLOYED'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const contactExited = await this.contactAccountRepository.findOne({
      where: { account: { id: account.id }, user: { id: req.user.id } },
    })

    if (contactExited) {
      ThrowHttpException(
        this.i18n.t('contact.CONTACT_EXIST'),
        HttpResponseStatus.CONFLICT
      )
    }

    const newContact = this.contactAccountRepository.create({
      account,
      alias,
      user: { id: req.user.id },
    })

    await this.contactAccountRepository.save(newContact)

    return HttpResponseSuccess(
      this.i18n.t('contact.CREATE_CONTACT_SUCCESS'),
      { alias, id: newContact.id },
      HttpResponseStatus.CREATED
    )
  }

  async getDataAccounts(req, page, limit, search) {
    const { skip, take, createResponse } = createPaginationData({
      limit,
      page,
    })

    let whereCondition: any = { user: { id: req.user.id } }
    if (search) {
      whereCondition = [
        { alias: ILike(`%${search}%`), user: { id: req.user.id } },
        {
          account: { accountNumber: ILike(`%${search}%`) },
          user: { id: req.user.id },
        },
      ]
    }

    const [contacts, total] = await this.contactAccountRepository.findAndCount({
      order: { alias: 'ASC' },
      relations: [EntitiesType.ACCOUNT, EntitiesType.RS_USER_ACCOUNT],
      select: {
        account: {
          accountNumber: true,
          id: true,
          owner: true,
          user: { email: true },
        },
        alias: true,
        id: true,
      },
      skip,
      take,
      where: whereCondition,
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      ...createResponse(total),
      contacts,
    })
  }
}
