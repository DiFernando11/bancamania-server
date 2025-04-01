import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  addMonths,
  differenceInDays,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isEqual,
  parse,
} from 'date-fns'
import { I18nService } from 'nestjs-i18n'
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  balanceFormat,
  bitcoinSymbol,
  formatDate,
  fullName,
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
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { statementCreditCss } from '@/src/modules/pdf/template/css/statementCredit.index'
import generateStatementHTML from '@/src/modules/pdf/template/statementCreditTemplate'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreateDeferredPurchaseDto } from './dto/create-deferred-purchase.dto'
import { GenerateStatementDto } from './dto/generate-statement-credit.dto'

@Injectable()
export class DeferredInstallmentService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly cardRepo: Repository<CreditCard>,
    @InjectRepository(DeferredInstallment)
    private readonly deferredInstallRepository: Repository<DeferredInstallment>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly pdfService: PdfService,
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

    creditCard.quota = Number(creditCard.quota) - Number(totalWithInterest)
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

      const deferredPurchase = i.deferredPurchase
      const monthlyLateRate =
        deferredPurchase.creditCard.version.latePaymentInterestRate
      const { lateFee, isOverdue, overdueDays } = this.calculateLateFee({
        amount,
        dailyRate: monthlyLateRate,
        dueDate,
      })

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
    dailyRate,
    dueDate,
  }: {
    amount: number
    dailyRate: number
    dueDate: Date
  }): { isOverdue: boolean; lateFee: number; overdueDays: number } => {
    const now = new Date()
    const isOverdue = isBefore(dueDate, now)
    if (!isOverdue) return { isOverdue: false, lateFee: 0, overdueDays: 0 }

    const overdueDays = isOverdue ? differenceInDays(now, dueDate) : 0

    if (overdueDays <= 0 || dailyRate <= 0)
      return { isOverdue: false, lateFee: 0, overdueDays: 0 }

    const totalWithInterest =
      Number(amount) * Math.pow(1 + Number(dailyRate), Number(overdueDays))
    const lateFee = totalWithInterest - Number(amount)

    return { isOverdue, lateFee: parseFloat(lateFee.toFixed(2)), overdueDays }
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
          const dailyRate =
            cuota.deferredPurchase.creditCard.version.latePaymentInterestRate
          const { lateFee } = this.calculateLateFee({
            amount: cuota.amount,
            dailyRate,
            dueDate: cuota.dueDate,
          })

          const totalConInteres = Number(cuota.amount) + Number(lateFee)
          const amountPaid = Number(cuota.amountPaid) ?? 0
          const saldo = balanceFormat(totalConInteres - amountPaid)

          if (remaining === 0) break
          cuota.paidAt = new Date()

          if (remaining >= saldo - amountPaid) {
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

  getCutoffDateRangeFromPeriod(period: string) {
    const parsed = parse(period, 'MM/yy', new Date())

    const month = parsed.getMonth() + 1
    const year = parsed.getFullYear()

    const start = new Date(year, month - 1, 16)
    const end = new Date(year, month, 15)

    return { end, start }
  }

  calculateStatementDebt(installments: DeferredInstallment[], start: Date) {
    let totalInstallmentsThisPeriod = 0
    let totalLateFees = 0
    let creditsOrPayments = 0
    let overdueInstallmentsCount = 0
    const uniquePurchases: DeferredPurchase[] = []
    const purchasesAlreadyCounted = new Set<string>()

    const periodCurrent = (period: Date) =>
      isAfter(period, start) || isEqual(period, start)

    for (const installment of installments) {
      const due = installment.dueDate
      const paidAt = installment.paidAt
      const amount = Number(installment.amount)
      const amountPaid = Number(installment.amountPaid ?? 0)
      const fullyPaid = installment.paid === true

      const isPaidBeforePeriod = paidAt && isBefore(paidAt, start)
      const isPaidInPeriod = paidAt && periodCurrent(paidAt)

      const amountPaidBefore = isPaidBeforePeriod ? amountPaid : 0
      const remainingBeforePeriod = amount - amountPaidBefore

      const amountFin = isPaidInPeriod ? amount : amount - amountPaid
      totalInstallmentsThisPeriod += amountFin

      if (isPaidInPeriod) {
        creditsOrPayments += amountPaid
      }

      const purchase = installment.deferredPurchase
      const id = purchase.id

      if (!purchasesAlreadyCounted.has(id)) {
        purchasesAlreadyCounted.add(id)
        uniquePurchases.push(purchase)
      }

      const isOverdueBeforePeriod = isBefore(due, start) && !fullyPaid
      if (isOverdueBeforePeriod) {
        if (remainingBeforePeriod > 0) {
          overdueInstallmentsCount++

          const { lateFee } = this.calculateLateFee({
            amount: remainingBeforePeriod,
            dailyRate:
              installment.deferredPurchase.creditCard.version
                .latePaymentInterestRate,
            dueDate: due,
          })

          totalLateFees += lateFee
        }
      }
    }

    const totalConsolidatedDebt = totalInstallmentsThisPeriod + totalLateFees

    const debitConsumption = uniquePurchases
      .filter((purchase) => periodCurrent(purchase.createdAt))
      .reduce((acc, p) => acc + Number(p.totalAmount), 0)

    return {
      creditsOrPayments,
      debitConsumption,
      minumPay: balanceFormat(totalConsolidatedDebt * PAY_MINUM_QUOTA),
      overdueInstallmentsCount,
      totalConsolidatedDebt: balanceFormat(totalConsolidatedDebt),
      totalLateFees: balanceFormat(totalLateFees),
    }
  }

  async generateStatementCreditPdf(
    req,
    creditCardId: string,
    dto: GenerateStatementDto
  ): Promise<Buffer> {
    const { start, end } = this.getCutoffDateRangeFromPeriod(dto.period)
    const installments: DeferredInstallment[] =
      await this.deferredInstallRepository.find({
        relations: {
          deferredPurchase: {
            creditCard: { user: { account: true }, version: true },
          },
        },
        where: {
          deferredPurchase: {
            creditCard: {
              id: creditCardId,
              user: { id: req.user.id },
            },
          },
          dueDate: LessThanOrEqual(end),
        },
      })

    let creditCard
    if (!installments?.length) {
      const credit = await this.cardRepo.findOne({
        where: { id: creditCardId, user: { id: req.user.id } },
      })
      if (!credit) {
        ThrowHttpException(
          this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
          HttpResponseStatus.NOT_FOUND
        )
      }
      creditCard = credit
    } else {
      creditCard = installments[0].deferredPurchase.creditCard
    }

    const createAtCredit = creditCard.createdAt
    const now = new Date()
    const nextStart = new Date(now.getFullYear(), now.getMonth(), 16)

    if (isBefore(end, createAtCredit) || isAfter(start, nextStart)) {
      ThrowHttpException(
        this.i18n.t('tarjetas.INVALID_PERIOD'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const tasaInterest = (
      creditCard.version.latePaymentInterestRate * 100
    ).toFixed(1)

    const isBeforeDateEmision = isBefore(createAtCredit, start)
    const dateEmision = isBeforeDateEmision ? start : createAtCredit
    const {
      totalConsolidatedDebt,
      debitConsumption,
      creditsOrPayments,
      minumPay,
      totalLateFees,
      overdueInstallmentsCount,
    } = this.calculateStatementDebt(installments, start)

    const html = generateStatementHTML({
      cardOwner: this.i18n.t('tarjetas.CARD_OWNER', {
        args: {
          number: `${creditCard.cardNumber} ${fullName(creditCard.user)}`,
        },
      }),
      cutDateLabel: this.i18n.t('tarjetas.CUT_DATE_LABEL'),
      dateEmision: formatDate(dateEmision, 'DD MMM YYYY'),
      dateEnd: formatDate(end, 'DD MMM YYYY'),
      emissionDateLabel: this.i18n.t('tarjetas.EMISSION_DATE_LABEL'),
      interestLabel: this.i18n.t('tarjetas.INTEREST_LABEL'),
      overdueInstallmentsCount,
      overdueInstallmentsLabel: this.i18n.t(
        'tarjetas.OVERDUE_INSTALLMENTS_LABEL'
      ),

      sectionOne: [
        {
          label: this.i18n.t('tarjetas.DEBIT_CONSUMPTION'),
          value: bitcoinSymbol(debitConsumption),
        },
        {
          label: this.i18n.t('tarjetas.CREDITS_OR_PAYMENTS'),
          value: bitcoinSymbol(creditsOrPayments),
        },
      ],
      sectionOneTitle: this.i18n.t('tarjetas.SECTION_ONE_TITLE'),
      sectionTwo: [
        {
          label: this.i18n.t('tarjetas.MAX_PAY_DATE'),
          value: formatDate(end, 'DD MMM YYYY'),
        },
        {
          label: this.i18n.t('tarjetas.TOTAL_TO_PAY_100'),
          value: bitcoinSymbol(totalConsolidatedDebt),
        },
        {
          label: this.i18n.t('tarjetas.MIN_TO_PAY_5'),
          value: bitcoinSymbol(minumPay),
        },
      ],
      sectionTwoTitle: this.i18n.t('tarjetas.SECTION_TWO_TITLE'),
      tasaInterest: `${tasaInterest}`,
      title: this.i18n.t('tarjetas.TITLE'),
      totalConsolidatedDebt: bitcoinSymbol(totalConsolidatedDebt),
      totalLateFees: bitcoinSymbol(totalLateFees),
      totalLateFeesLabel: this.i18n.t('tarjetas.TOTAL_LATE_FEES_LABEL'),
      totalToPayLabel: this.i18n.t('tarjetas.TOTAL_TO_PAY_LABEL'),
    })

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
           ${statementCreditCss}
          </style>
        </head>
        <body>
         ${html}
        </body>
      </html>
    `

    return await this.pdfService.generatePdfBuffer(htmlContent)
  }
}
