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
import { Account } from '@/src/modules/account/account.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { TransferDto } from '@/src/modules/transfers/dto/createTransfer.dto'

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly i18n: I18nService
  ) {}

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

    const receipt = await this.executeTransferTransaction(
      req,
      transferDto,
      account
    )

    return HttpResponseSuccess(this.i18n.t('account.TRANSFER_SUCCESS'), {
      receiptId: receipt.id,
    })
  }

  private async executeTransferTransaction(
    req,
    transferDto: TransferDto,
    account: Account
  ) {
    return await this.accountRepository.manager.transaction(
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
            typeMovement: TypeMovement.TRANSFER,
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
            typeMovement: TypeMovement.TRANSFER,
            user: { id: userId },
          })

          const receipt = await transactionalEntityManager
            .getRepository(Receipt)
            .save({
              dataReceipts: [
                ...(transferDto.motive
                  ? [
                      {
                        key: 'reason',
                        value: transferDto.motive,
                      },
                    ]
                  : []),
                {
                  key: 'amount',
                  style: {
                    hr: true,
                  },
                  value: amountDecimal.toString(),
                },
                { key: 'originAccount' },
                { key: 'name', value: account.owner },
                {
                  key: 'accountNumber',
                  style: {
                    hr: true,
                  },
                  value: account.accountNumber,
                },
                { key: 'accountDestine' },
                { key: 'name', value: dataDestination.owner },
                {
                  key: 'accountNumber',
                  value: dataDestination.accountNumber,
                },
              ],
              description: saveTranslation({
                args: {
                  balance: amountDecimal,
                  date: formatDate(new Date(), 'DD MMM'),
                },
                key: 'movements.MOV_SEND_TRANSFER',
              }),
              title: 'titleTransfer',
              user: { id: req.user.id },
            })

          return receipt
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
