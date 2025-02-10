import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { ThrowHttpException } from '@/src/common/utils'
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

    const account = new Account()
    account.accountNumber =
      usuario.id.slice(0, 4) +
      Math.floor(100000 + Math.random() * 900000).toString()
    account.balance = 0
    account.status = 'active'
    account.user = usuario

    return await this.accountRepository.save(account)
  }
}
