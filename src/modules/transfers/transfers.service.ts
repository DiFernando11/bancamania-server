import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  formatDate,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { Account } from '@/src/modules/account/account.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { TransferDto } from '@/src/modules/transfers/dto/createTransfer.dto'

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly i18n: I18nService
  ) {}

  async verifyAccount({ accountId }) {
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

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      accountNumber: account.accountNumber,
      email: account.user.email,
      id: account.id,
      owner: account.owner,
    })
  }

  async transferFunds(req, transferDto: TransferDto) {
    const account = await this.accountRepository.findOne({
      where: { user: { id: req.user.id } },
    })

    const { amount, destinationAccountId, originAccountId } = transferDto

    if (!account) {
      ThrowHttpException(
        this.i18n.t('account.ACOUNT_ID_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    if (amount > account.balance) {
      ThrowHttpException(this.i18n.t('account.INSUFFICIENT_BALANCE'))
    }

    if (originAccountId !== account.id) {
      ThrowHttpException(
        this.i18n.t('account.FORBIDDEN_TRANSFER'),
        HttpResponseStatus.FORBIDDEN
      )
    }

    if (destinationAccountId === originAccountId) {
      ThrowHttpException(this.i18n.t('account.DIFFERENT_ID_TRANSFER'))
    }

    await this.executeTransferTransaction(req, transferDto, account)

    return HttpResponseSuccess(this.i18n.t('account.TRANSFER_SUCCESS'))
  }

  private async executeTransferTransaction(
    req,
    transferDto: TransferDto,
    account: Account
  ) {
    await this.accountRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          const amountDecimal = parseFloat(transferDto.amount.toFixed(2))
          const originResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Account)
            .set({ balance: () => 'CAST(balance AS numeric) - :amount' })
            .where('id::text = :originAccountId AND balance >= :amount', {
              amount: amountDecimal,
              originAccountId: transferDto.originAccountId,
            })
            .returning(['balance'])
            .execute()

          if (originResult.affected === 0) {
            ThrowHttpException(this.i18n.t('account.ORIGIN_ACCOUNT_ERROR'))
          }

          // 🔹 Actualizamos la cuenta de destino
          const destinationResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Account)
            .set({ balance: () => 'CAST(balance AS numeric) + :amount' })
            .where('id::text = :destinationAccountId')
            .returning('*')
            .setParameters({
              amount: amountDecimal,
              destinationAccountId: transferDto.destinationAccountId,
            })
            .execute()

          if (destinationResult.affected === 0) {
            ThrowHttpException(this.i18n.t('account.NOT_FOUND_ACCOUNT_DESTINE'))
          }

          const dataDestination = destinationResult.raw[0]
          const newDestinationBalance = dataDestination.balance
          const newOriginBalance = originResult.raw[0].balance

          await transactionalEntityManager.getRepository(Movement).save({
            account: { id: transferDto.originAccountId },
            balance: -Math.abs(amountDecimal),
            description: saveTranslation({
              args: {
                balance: amountDecimal,
                date: formatDate(new Date(), 'DD MMM'),
              },
              key: 'movements.MOV_SEND_TRANSFER',
            }),
            title: dataDestination?.owner,
            totalBalance: newOriginBalance,
            typeMovement: TypeMovement.WALLET,
            user: { id: req.user.id },
          })

          const { userId, ...rest } = dataDestination

          await transactionalEntityManager.getRepository(Movement).save({
            account: rest,
            balance: amountDecimal,
            description: saveTranslation({
              args: {
                balance: amountDecimal,
                date: formatDate(new Date(), 'DD MMM'),
              },
              key: 'movements.MOV_RECEIVE_TRANSFER',
            }),
            title: account.owner,
            totalBalance: newDestinationBalance,
            typeMovement: TypeMovement.WALLET,
            user: { id: userId },
          })
        } catch (error) {
          ThrowHttpException(
            this.i18n.t('account.TRANSFER_FAILED'),
            HttpResponseStatus.BAD_REQUEST,
            error
          )
        }
      }
    )
  }
}
