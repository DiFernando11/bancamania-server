import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  addMonths,
  differenceInDays,
  getMonth,
  getYear,
  isBefore,
} from 'date-fns'
import { I18nService } from 'nestjs-i18n'
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { DeferredInstallment } from '@/src/modules/deferredInstallment/deferredInstallment.entity'
import { DeferredPurchase } from '@/src/modules/deferredInstallment/deferredPurchase.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'

@Injectable()
export class DeferredInstallmentService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly cardRepo: Repository<CreditCard>,
    @InjectRepository(DeferredInstallment)
    private readonly deferredInstallRepository: Repository<DeferredInstallment>,
    private readonly i18n: I18nService
  ) {}

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
    const interestRateVersion = isInterest ? creditCard.version.interestRate : 0

    const totalWithInterest =
      total * Math.pow(1 + Number(interestRateVersion), deferredMonth)

    const baseAmount = parseFloat(
      (totalWithInterest / deferredMonth).toFixed(2)
    )
    const roundedTotal = baseAmount * deferredMonth
    const adjustment = parseFloat((totalWithInterest - roundedTotal).toFixed(2))

    const installment = baseAmount
    const lastInstallment = parseFloat((baseAmount + adjustment).toFixed(2))

    return {
      adjustment,
      installment,
      interestRate: creditCard.version.interestRate,
      interestTotal: (totalWithInterest - total).toFixed(2),
      lastInstallment,
      total,
      totalWithInterest: totalWithInterest.toFixed(2),
    }
  }

  runCreateQuotas = async (
    manager: EntityManager,
    creditCard: CreditCard,
    dto: CreateDeferredPurchaseDto
  ) => {
    const { total, deferredMonth, description } = dto

    if (creditCard.quota < total) {
      ThrowHttpException(
        this.i18n.t('tarjetas.INSUFFICIENT_QUOTA'),
        HttpResponseStatus.CONFLICT
      )
    }

    const {
      totalWithInterest,
      adjustment,
      interestRate,
      installment,
      interestTotal,
      lastInstallment,
    } = this.readInstallment({
      creditCard,
      deferredMonth,
      total,
    })

    const deferredPurchase = manager.getRepository(DeferredPurchase).create({
      creditCard,
      description,
      interestRate: Number(interestTotal) === 0 ? 0 : interestRate,
      originalAmount: total,
      totalAmount: parseFloat(totalWithInterest),
      totalInstallments: deferredMonth,
    })

    await manager.getRepository(DeferredPurchase).save(deferredPurchase)

    const now = new Date()

    const firstDueDate = new Date(getYear(now), getMonth(now) + 1, 15)

    const installments: DeferredInstallment[] = []

    for (let i = 0; i < deferredMonth; i++) {
      const dueDate = addMonths(firstDueDate, i)

      let monthlyAmount = installment
      if (i === deferredMonth - 1) {
        monthlyAmount = parseFloat((monthlyAmount + adjustment).toFixed(2))
      }

      installments.push(
        manager.getRepository(DeferredInstallment).create({
          amount: monthlyAmount,
          deferredPurchase,
          dueDate,
          installmentNumber: i + 1,
        })
      )
    }

    await manager.getRepository(DeferredInstallment).save(installments)

    creditCard.quota = Number(creditCard.quota) - total
    await manager.getRepository(CreditCard).save(creditCard)

    return {
      installment,
      interestRate,
      interestTotal,
      lastInstallment,
      purchaseId: deferredPurchase.id,
      total,
      totalAmountWithInterest: parseFloat(totalWithInterest),
    }
  }

  async createQuotas(creditCard: CreditCard, dto: CreateDeferredPurchaseDto) {
    return await this.cardRepo.manager.transaction((manager) =>
      this.runCreateQuotas(manager, creditCard, dto)
    )
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

    const quotas = await this.createQuotas(creditCard, dto)

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), quotas)
  }

  async getPendingInstallmentsForCurrentMonth(req, creditCardId: string) {
    const now = new Date()
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() + 1, 15)

    const installments = await this.deferredInstallRepository.find({
      order: { dueDate: 'ASC' },
      relations: {
        deferredPurchase: {
          creditCard: {
            user: true,
            version: true,
          },
        },
      },
      where: {
        deferredPurchase: {
          creditCard: {
            id: creditCardId,
            user: {
              id: req.user.id,
            },
          },
        },
        paid: false,
      },
    })

    if (!installments) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.CONFLICT
      )
    }

    let minimumPayment = 0
    let totalAmount = 0
    let totalPaymentAtOnce = 0

    const detailedInstallments = installments.map((i) => {
      const amount = Number(i.amount)
      const dueDate = i.dueDate
      const isOverdue = isBefore(dueDate, now)
      const overdueDays = isOverdue ? differenceInDays(now, dueDate) : 0

      const deferredPurchase = i.deferredPurchase
      const monthlyLateRate =
        deferredPurchase.creditCard.version.latePaymentInterestRate
      const dailyLateRate = monthlyLateRate / 30

      const lateFee = isOverdue
        ? parseFloat((amount * dailyLateRate * overdueDays).toFixed(2))
        : 0

      const totalToPay = parseFloat((amount + lateFee).toFixed(2))

      if (isOverdue) {
        minimumPayment += totalToPay
      } else {
        minimumPayment += amount * 0.05
      }

      if (
        isBefore(dueDate, cutoffDate) ||
        dueDate.getTime() === cutoffDate.getTime()
      ) {
        totalAmount += totalToPay
      }

      totalPaymentAtOnce += totalToPay

      return {
        amount,
        dayOfpurchase: deferredPurchase.createdAt,
        description: this.i18n.t(`store.${deferredPurchase.description}`),
        dueDate,
        id: i.id,
        installmentNumber: i.installmentNumber,
        isOverdue,
        lateFee,
        overdueDays,
        paid: i.paid,
        totalInstallments: deferredPurchase.totalInstallments,
        totalToPay,
        versionName: deferredPurchase.creditCard.version.name,
      }
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      installments: detailedInstallments.filter((i) => i.dueDate <= cutoffDate),
      lastDayWithoutInterest: cutoffDate,
      minimumPayment: parseFloat(minimumPayment.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalPaymentAtOnce: parseFloat(totalPaymentAtOnce.toFixed(2)),
    })
  }
}
