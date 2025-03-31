import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  addMonths,
  differenceInDays,
  getMonth,
  getYear,
  isAfter,
  isBefore,
} from 'date-fns'
import { I18nService } from 'nestjs-i18n'
import { EntityManager, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  balanceFormat,
  bitcoinSymbol,
  formatDate,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { Account } from '@/src/modules/account/account.entity'
import { PAY_MINUM_QUOTA } from '@/src/modules/deferredInstallment/constants'
import { DeferredInstallment } from '@/src/modules/deferredInstallment/deferredInstallment.entity'
import { DeferredPurchase } from '@/src/modules/deferredInstallment/deferredPurchase.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'

@Injectable()
export class DeferredInstallmentService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly cardRepo: Repository<CreditCard>,
    @InjectRepository(DeferredInstallment)
    private readonly deferredInstallRepository: Repository<DeferredInstallment>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
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
      const amountPaid = Number(i.amountPaid)
      const dueDate = i.dueDate
      const isOverdue = isBefore(dueDate, now)
      const overdueDays = isOverdue ? differenceInDays(now, dueDate) : 0

      const deferredPurchase = i.deferredPurchase
      const monthlyLateRate =
        deferredPurchase.creditCard.version.latePaymentInterestRate
      const lateFee = isOverdue
        ? this.calculateLateFee({
            amount,
            dailyRate: monthlyLateRate,
            daysLate: overdueDays,
          })
        : 0

      const totalToPay = parseFloat((amount + lateFee).toFixed(2))

      const totalAmountWithoutPay = totalToPay - amountPaid

      if (!isAfter(dueDate, cutoffDate)) {
        totalAmount += totalAmountWithoutPay
        if (isOverdue) {
          minimumPayment += totalAmountWithoutPay
        } else {
          minimumPayment += (amount - amountPaid) * PAY_MINUM_QUOTA
        }
      }

      totalPaymentAtOnce += totalAmountWithoutPay

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
        totalToPay: totalAmountWithoutPay,
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

  calculateLateFee = ({
    amount,
    daysLate,
    dailyRate,
  }: {
    amount: number
    daysLate: number
    dailyRate: number
  }): number => {
    if (daysLate <= 0 || dailyRate <= 0) return 0

    const totalWithInterest =
      Number(amount) * Math.pow(1 + Number(dailyRate), Number(daysLate))
    const lateFee = totalWithInterest - Number(amount)

    return parseFloat(lateFee.toFixed(2))
  }

  async payInstallmentsAmount(req, creditCardId: string, amount: number) {
    return await this.deferredInstallRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const now = new Date()
        let remaining = Number(amount)

        const installments = await transactionalEntityManager.find(
          this.deferredInstallRepository.target,
          {
            relations: {
              deferredPurchase: { creditCard: { user: { account: true } } },
            },
            where: {
              deferredPurchase: {
                creditCard: {
                  id: creditCardId,
                  user: { id: req.user.id },
                },
              },
              paid: false,
            },
          }
        )

        if (!installments.length) {
          ThrowHttpException(
            this.i18n.t('tarjetas.QUOTA_NOT_FOUND'),
            HttpResponseStatus.CONFLICT
          )
        }

        const cuotasOrdenadas = installments.sort((a, b) => {
          const aOverdue = a.dueDate < now
          const bOverdue = b.dueDate < now

          if (aOverdue && !bOverdue) return -1
          if (!aOverdue && bOverdue) return 1

          return a.dueDate.getTime() - b.dueDate.getTime()
        })

        const cuotasPagadas: DeferredInstallment[] = []

        for (const cuota of cuotasOrdenadas) {
          const isOverdue = cuota.dueDate < now
          const amountPaid = Number(cuota.amountPaid) ?? 0
          const overdueDays = isOverdue
            ? differenceInDays(now, cuota.dueDate)
            : 0

          const dailyRate =
            cuota.deferredPurchase.creditCard.version.latePaymentInterestRate
          const lateFee = isOverdue
            ? this.calculateLateFee({
                amount: cuota.amount,
                dailyRate,
                daysLate: overdueDays,
              })
            : 0

          const totalConInteres = Number(cuota.amount) + Number(lateFee)
          const saldo = balanceFormat(totalConInteres - amountPaid)

          if (remaining === 0) break
          cuota.paidAt = new Date()

          if (remaining >= saldo) {
            cuota.amountPaid = amountPaid + saldo
            cuota.paid = true
            cuotasPagadas.push(cuota)
            remaining = balanceFormat(remaining - saldo)
          } else {
            cuota.amountPaid = amountPaid + remaining
            cuota.paidAt = new Date()
            cuotasPagadas.push(cuota)
            remaining = 0
            break
          }
        }

        const account = installments[0].deferredPurchase.creditCard.user.account
        const payInstallment = balanceFormat(amount - remaining)

        if (payInstallment > account.balance) {
          ThrowHttpException(
            this.i18n.t('account.INSUFFICIENT_BALANCE'),
            HttpResponseStatus.CONFLICT
          )
        }

        await transactionalEntityManager.save(cuotasPagadas)

        await transactionalEntityManager.save(Account, {
          ...account,
          balance: balanceFormat(account.balance - payInstallment),
        })

        const version = installments[0].deferredPurchase.creditCard.version.name

        await transactionalEntityManager.save(Movement, {
          account: { id: account.id },
          balance: -payInstallment,
          description: saveTranslation({
            args: {
              balance: bitcoinSymbol(payInstallment),
              brand: version,
              date: formatDate(new Date(), 'DD MMM'),
            },
            key: 'movements.PAY_CREDIT',
          }),
          title: this.i18n.t('movements.THANKS_PAY_CREDIT'),
          totalBalance: balanceFormat(account.balance - payInstallment),
          typeMovement: TypeMovement.WALLET,
          user: { id: req.user.id },
        })

        const receipt = await transactionalEntityManager.save(Receipt, {
          dataReceipts: [
            {
              key: 'detailCard',
              style: {
                hr: true,
              },
            },
            {
              key: 'version',
              value: version,
            },
            {
              key: 'numberCard',
              style: {
                hr: true,
              },
              value: installments[0].deferredPurchase.creditCard.cardNumber,
            },
            {
              key: 'total',
              value: bitcoinSymbol(payInstallment),
            },
          ],
          description: saveTranslation({
            args: {
              balance: bitcoinSymbol(payInstallment),
              brand: version,
              date: formatDate(new Date(), 'DD MMM'),
            },
            key: 'movements.PAY_CREDIT',
          }),
          title: 'titlePayInstallments',
          user: { id: req.user.id },
        })

        return HttpResponseSuccess(this.i18n.t('tarjetas.PAY_QUOTA_SUCCESS'), {
          amountUsed: payInstallment,
          receiptID: receipt.id,
        })
      }
    )
  }
}
