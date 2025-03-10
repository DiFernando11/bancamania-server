import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  formatDate,
  fullName,
  generateUniqueNumber,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { VerifyAccountDto } from '@/src/modules/account/dto/verifyAccount.dto'
import { ContactAccount } from '@/src/modules/contacts/contactAccounts.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { Usuario } from '@/src/modules/users/users.entity'
import { Account } from './account.entity'

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(ContactAccount)
    private readonly contactAccountRepository: Repository<ContactAccount>,
    private readonly i18n: I18nService,
    private readonly movements: MovementsService
  ) {}

  async createAccount(req) {
    const initialBalance = 50
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.ACCOUNT],
      where: { id: req.user.id },
    })

    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    if (user.account) {
      ThrowHttpException(
        this.i18n.t('account.ACCOUNT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const newAccount = this.accountRepository.create({
      accountNumber: generateUniqueNumber(user.id),
      balance: initialBalance,
      owner: fullName(user),
      user,
    })

    const currentAccount = await this.accountRepository.save(newAccount)

    await this.movements.createLastMovement(
      { ...user, account: currentAccount },
      {
        description: saveTranslation({
          args: { date: formatDate(currentAccount.createdAt, 'DD MMM') },
          key: 'movements.MOV_ACCOUNT_CREATE',
        }),
        relations: [EntitiesType.ACCOUNT],
        title: fullName(user),
        totalBalance: 0,
        typeMovement: TypeMovement.WALLET,
      }
    )
    await this.movements.createLastMovement(
      { ...user, account: currentAccount },
      {
        balance: initialBalance,
        description: saveTranslation({
          key: 'movements.MOV_GIFT_BALANCE',
        }),
        relations: [EntitiesType.ACCOUNT],
        title: fullName(user),
        totalBalance: 50,
        typeMovement: TypeMovement.GIFT,
      }
    )
    return HttpResponseSuccess(
      this.i18n.t('account.CREATE_ACCOUNT'),
      HttpResponseStatus.CREATED
    )
  }

  async getAccountUser(req) {
    const user = await this.accountRepository.findOne({
      where: { user: { id: req.user.id } },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), user)
  }

  async verifyAccount(params: VerifyAccountDto, req) {
    const account = await this.accountRepository.findOne({
      relations: [EntitiesType.USER],
      where: { accountNumber: params.accountNumber },
    })

    if (!account) {
      ThrowHttpException(
        this.i18n.t('account.ACOUNT_ID_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    if (account.user.id === req.user.id) {
      ThrowHttpException(
        this.i18n.t('account.TRANSFER_YOUR_SELF'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const isAddContact = await this.contactAccountRepository.findOne({
      where: { account: { id: account.id }, user: { id: req.user.id } },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      accountNumber: account.accountNumber,
      email: account.user.email,
      id: account.id,
      isAddContact: Boolean(isAddContact),
      owner: account.owner,
    })
  }
}
