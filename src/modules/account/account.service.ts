import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { Usuario } from '@/src/modules/users/users.entity'
import { Account } from './account.entity'

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly i18n: I18nService
  ) {}

  async createAccount(req) {
    const usuario = await this.userRepository.findOne({
      relations: ['account'],
      where: { email: req.email },
    })

    if (!usuario) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    if (usuario.account) {
      ThrowHttpException(
        this.i18n.t('account.ACCOUNT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const numberAccount =
      usuario.id.slice(0, 4) +
      Math.floor(100000 + Math.random() * 900000).toString()

    const account = new Account()
    account.accountNumber = numberAccount
    account.balance = 50
    account.status = 'active'
    account.user = usuario

    await this.accountRepository.save(account)
    return HttpResponseSuccess(this.i18n.t('account.CREATE_ACCOUNT'), {
      firstName: usuario?.first_name,
      lastName: usuario?.last_name,
      numberAccount,
    })
  }

  async getAccountUser(req) {
    console.log('LLAMANDO AL SERVICIO')
    const user = await this.userRepository.findOne({
      relations: ['account'],
      where: { email: req.email },
    })

    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    return HttpResponseSuccess(this.i18n.t('account.GET_SUCCESS'), {
      account: user.account,
      firstName: user.first_name,
      lastName: user.last_name,
    })
  }
}
