import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { ThrowHttpException } from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { DeferredInstallment } from '@/src/modules/deferredInstallment/deferredInstallment.entity'
import { DeferredPurchase } from '@/src/modules/deferredInstallment/deferredPurchase.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'

@Injectable()
export class DeferredInstallmentService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly cardRepo: Repository<CreditCard>,
    private readonly i18n: I18nService
  ) {}

  async createQuotas(creditCard: CreditCard, dto: CreateDeferredPurchaseDto) {
    const { total, deferredMonth } = dto
    if (creditCard.quota < total) {
      ThrowHttpException(
        this.i18n.t('tarjetas.INSUFFICIENT_QUOTA'),
        HttpResponseStatus.CONFLICT
      )
    }
    const { totalWithInterest, baseAmount, adjustment, interestRate } =
      this.readInstallment({
        creditCard,
        deferredMonth,
        total,
      })
    return await this.cardRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const deferredPurchase = transactionalEntityManager
          .getRepository(DeferredPurchase)
          .create({
            creditCard,
            interestRate,
            originalAmount: total,
            totalAmount: parseFloat(totalWithInterest.toFixed(2)),
            totalInstallments: deferredMonth,
          })
        await transactionalEntityManager
          .getRepository(DeferredPurchase)
          .save(deferredPurchase)
        const now = new Date()
        const installments: DeferredInstallment[] = []
        for (let i = 0; i < deferredMonth; i++) {
          const dueDate = new Date(now)
          dueDate.setMonth(dueDate.getMonth() + i)
          let monthlyAmount = baseAmount
          if (i === deferredMonth - 1) {
            monthlyAmount = parseFloat((monthlyAmount + adjustment).toFixed(2))
          }
          installments.push(
            transactionalEntityManager
              .getRepository(DeferredInstallment)
              .create({
                amount: monthlyAmount,
                deferredPurchase,
                dueDate,
                installmentNumber: i + 1,
              })
          )
        }
        await transactionalEntityManager
          .getRepository(DeferredInstallment)
          .save(installments)
        creditCard.quota = Number(creditCard.quota) - total
        await transactionalEntityManager
          .getRepository(CreditCard)
          .save(creditCard)
        return {
          installments,
          purchaseId: deferredPurchase.id,
          totalAmountWithInterest: parseFloat(totalWithInterest.toFixed(2)),
        }
      }
    )
  }

  readInstallment({
    creditCard,
    deferredMonth,
    total,
  }: {
    creditCard: CreditCard
    deferredMonth: number
    total: number
  }) {
    const isInterest =
      deferredMonth > creditCard.version.maxInstallmentsWithoutInterest
    const interestMonth = isInterest
      ? deferredMonth * creditCard.version.interestRate
      : 0
    const interestTotal = total * interestMonth
    const totalWithInterest = total + interestTotal
    const baseAmount = parseFloat(
      (totalWithInterest / deferredMonth).toFixed(2)
    )
    const roundedTotal = baseAmount * deferredMonth
    const adjustment = parseFloat((totalWithInterest - roundedTotal).toFixed(2))
    return {
      adjustment,
      baseAmount,
      interestRate: isInterest ? creditCard.version.interestRate : 0,
      interestTotal,
      totalWithInterest,
    }
  }

  async createDeferredPurchase(req, dto: CreateDeferredPurchaseDto) {
    const { cardId } = dto

    const creditCard = await this.cardRepo.findOne({
      where: { id: cardId, user: { id: req.user.id } },
    })

    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.CONFLICT
      )
    }

    await this.createQuotas(creditCard, dto)

    return {
      status: 'success',
    }
  }
}
