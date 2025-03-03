import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { Account } from '@/src/modules/account/account.entity'
import { TransferDto } from '@/src/modules/transfers/dto/createTransfer.dto'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly i18n: I18nService
  ) {}

  async transferFunds(req, transferDto: TransferDto) {
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

    if (transferDto.amount > user.account.balance) {
      ThrowHttpException(this.i18n.t('account.INSUFFICIENT_BALANCE'))
    }

    if (transferDto.originAccountId !== user.account.id) {
      ThrowHttpException(
        this.i18n.t('account.FORBIDDEN_TRANSFER'),
        HttpResponseStatus.FORBIDDEN
      )
    }

    if (transferDto.destinationAccountId === transferDto.originAccountId) {
      ThrowHttpException(this.i18n.t('account.DIFFERENT_ID_TRANSFER'))
    }

    await this.accountRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const amountDecimal = parseFloat(transferDto.amount.toFixed(2))
        const debitResult = await transactionalEntityManager
          .createQueryBuilder()
          .update(Account)
          .set({ balance: () => 'CAST(balance AS numeric) - :amount' })
          .where('id::text = :originAccountId AND balance >= :amount', {
            amount: amountDecimal,
            originAccountId: user.account.id,
          })
          .execute()

        if (debitResult.affected === 0) {
          ThrowHttpException(
            this.i18n.t('account.ORIGIN_ACCOUNT_ERROR'),
            HttpResponseStatus.BAD_REQUEST,
            debitResult
          )
        }

        const creditResult = await transactionalEntityManager
          .createQueryBuilder()
          .update(Account)
          .set({ balance: () => 'CAST(balance AS numeric) + :amount' })
          .where('id::text = :destinationAccountId', {
            amount: amountDecimal,
            destinationAccountId: transferDto.destinationAccountId,
          })
          .execute()

        if (creditResult.affected === 0) {
          ThrowHttpException(
            this.i18n.t('account.NOT_FOUND_ACCOUNT_DESTINE'),
            HttpResponseStatus.NOT_FOUND,
            creditResult
          )
        }
      }
    )
    return HttpResponseSuccess(this.i18n.t('account.TRANSFER_SUCCESS'))
  }
}
