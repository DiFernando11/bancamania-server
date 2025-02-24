import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  formatDate,
  fullName,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
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
    private readonly i18n: I18nService,
    private readonly movements: MovementsService
  ) {}

  async createAccount(req) {
    const initialBalance = 50
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.ACCOUNT],
      where: { email: req.email },
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
    const numberAccount =
      user.id.slice(0, 4) +
      Math.floor(100000 + Math.random() * 900000).toString()

    const newAccount = this.accountRepository.create({
      accountNumber: numberAccount,
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
        typeMovement: TypeMovement.GIFT,
      }
    )
    return HttpResponseSuccess(this.i18n.t('account.CREATE_ACCOUNT'), {
      firstName: user?.first_name,
      lastName: user?.last_name,
      numberAccount,
    })
  }

  async getAccountUser(req) {
    const user = await this.accountRepository.findOne({
      where: { user: req.id },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), user)
  }
}
