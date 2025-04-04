import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { In, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  bitcoinSymbol,
  createPaginationData,
  fullName,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { Account } from '@/src/modules/account/account.entity'
import { DeferredInstallmentService } from '@/src/modules/deferredInstallment'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { CreateItemStoreDto } from '@/src/modules/store/dto/createItemStore.dto'
import { PurchaseItemsStoreDto } from '@/src/modules/store/dto/purchaseItemStore.dto'
import { Store } from '@/src/modules/store/store.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { METHOD_PAY, TYPE_CARD } from '@/src/modules/tarjetas/enum/cards'
import { CardStatus } from '@/src/modules/tarjetas/enum/cardStatus.enum'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(CreditCard)
    private readonly creditCardRepository: Repository<CreditCard>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly deferredInstallmentService: DeferredInstallmentService,
    private readonly i18n: I18nService
  ) {}

  async createItemStore(dto: CreateItemStoreDto) {
    const newStore = this.storeRepository.create(dto)
    const store = await this.storeRepository.save(newStore)
    return HttpResponseSuccess(
      this.i18n.t('store.CREATE_SUCCESS'),
      store,
      HttpResponseStatus.CREATED
    )
  }

  async getItemsStore(page, limit) {
    const { skip, take, createResponse } = createPaginationData({
      limit,
      page,
    })

    const [store, total] = await this.storeRepository.findAndCount({
      skip,
      take,
    })
    const storeFormat = store.map((data) => ({
      ...data,
      description: this.i18n.t(`store.${data.description}`),
      title: this.i18n.t(`store.${data.title}`),
    }))

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      ...createResponse(total),
      store: storeFormat,
    })
  }

  async purchaseDebit(user: Usuario, products) {
    if (!user.debitCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.DEBIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    const { formatProductReceipt, total } =
      await this.getInformationPurchaseProducts({
        products,
      })
    return await this.accountRepository.manager.transaction(
      async (transactionalEntityManager) => {
        if (user.debitCard.status === CardStatus.BLOCKED) {
          ThrowHttpException(
            this.i18n.t('tarjetas.CARD_DISABLED'),
            HttpResponseStatus.CONFLICT
          )
        }
        if (total > user.debitCard.account.balance) {
          ThrowHttpException(
            this.i18n.t('account.INSUFFICIENT_BALANCE'),
            HttpResponseStatus.BAD_REQUEST
          )
        }

        const rawBalance = user.debitCard.account.balance - total
        const balance = Math.ceil(rawBalance * 100) / 100

        await transactionalEntityManager
          .getRepository(Account)
          .update({ id: user.debitCard.account.id }, { balance })

        await transactionalEntityManager.getRepository(Movement).save({
          account: user.debitCard.account,
          debitCard: user.debitCard,
          description: saveTranslation({
            args: { balance: bitcoinSymbol(total) },
            key: 'movements.PURCHASE_DEBIT',
          }),
          title: fullName(user),
          totalBalance: balance,
          typeMovement: TypeMovement.SHOPPING,
          user,
        })

        const receipt = await transactionalEntityManager
          .getRepository(Receipt)
          .save({
            dataReceipts: [
              { key: 'payMethod', style: { hr: true } },
              { key: 'typeCard', value: TYPE_CARD.DEBIT.toUpperCase() },
              { key: 'numberCard', value: user.debitCard.cardNumber },
              {
                key: 'originAccount',
                style: { hr: true },
                value: user.debitCard.account.accountNumber,
              },
              { key: 'products', style: { hr: true } },
              ...formatProductReceipt,
              { key: 'total', value: bitcoinSymbol(total) },
            ],
            description: saveTranslation({
              args: { balance: bitcoinSymbol(total) },
              key: 'movements.PURCHASE_DEBIT',
            }),
            title: 'purchaseSuccess',
            user,
          })

        return HttpResponseSuccess(this.i18n.t('store.PURCHASE_SUCCESS'), {
          receiptID: receipt.id,
        })
      }
    )
  }

  async getInformationPurchaseProducts({
    products,
    methodPay = METHOD_PAY.BITCOIN,
  }) {
    const productIds = products.map((p) => p.id)

    const productsArray = await this.storeRepository.findBy({
      id: In(productIds),
    })

    const priceProduct = (price) =>
      methodPay === METHOD_PAY.BITCOIN
        ? bitcoinSymbol(price)
        : this.i18n.t('tarjetas.MILES', {
            args: { miles: price },
          })

    const formatProductReceipt = productsArray.flatMap((item) => {
      const price = methodPay === METHOD_PAY.BITCOIN ? item.price : item.miles

      const productQuantity = products.find((pr) => pr.id === item.id)
      return [
        {
          key: 'title',
          value: this.i18n.t(`store.${item.title}`),
        },
        {
          key: 'quantity',
          value: productQuantity.quantity,
        },
        {
          key: 'valueUnit',
          value: priceProduct(price),
        },
        {
          key: 'totalItem',
          style: {
            hr: true,
          },
          value: priceProduct(price * productQuantity.quantity),
        },
      ]
    })

    const total = products.reduce((acc, item) => {
      const product = productsArray.find((p) => p.id === item.id)
      if (!product) return acc

      const priceProduct =
        methodPay === METHOD_PAY.BITCOIN ? product.price : product.miles

      return acc + priceProduct * item.quantity
    }, 0)

    return { formatProductReceipt, total }
  }

  dinamicCreateDataReceipt({
    deferredMonth,
    installment,
    interestTotal,
    totalPurchase,
    total,
    interestRate,
    isMethodBitcoin,
    methodPay,
  }) {
    const args: Record<string, any> = {}
    const isDeferred = deferredMonth > 1
    let keyTypePurchase = 'PURCHASE_CREDIT'

    if (isMethodBitcoin) {
      if (isDeferred) {
        args.month = deferredMonth
        args.quotas = bitcoinSymbol(installment)
        keyTypePurchase = 'PURCHASE_CREDIT_DEFERRED'
      } else {
        args.balance = bitcoinSymbol(totalPurchase)
      }
    } else {
      args.miles = totalPurchase
      keyTypePurchase = 'PURCHASE_CREDIT_MILES'
    }

    const description = saveTranslation({
      args,
      key: `movements.${keyTypePurchase}`,
    })

    const benefitWithoutInterest = [
      { key: 'totalWithoutInteres', value: bitcoinSymbol(total) },
      {
        key: 'monthlyInterestRate',
        value: `${interestRate}%`,
      },
    ]

    const isDeffered = deferredMonth > 1

    const deferredPurchaseData = [
      { key: 'deferred', style: { hr: true } },
      { key: 'numberQuotas', value: deferredMonth },
      { key: 'averageMonthlyFee', value: bitcoinSymbol(installment) },
    ]

    const deferredPurchase =
      isDeffered && isMethodBitcoin ? deferredPurchaseData : []

    const showInterest = isMethodBitcoin && Number(interestTotal) !== 0

    const interestPurchase = showInterest ? benefitWithoutInterest : []

    const keyMethodBitcoin =
      showInterest && isDeffered ? 'totalWhitInterest' : 'total'

    const keyTotal = isMethodBitcoin ? keyMethodBitcoin : 'total'

    const valueTotal =
      METHOD_PAY.BITCOIN === methodPay
        ? bitcoinSymbol(totalPurchase)
        : this.i18n.t('tarjetas.MILES', {
            args: { miles: totalPurchase },
          })

    return {
      deferredPurchase,
      description,
      interestPurchase,
      keyTotal,
      valueTotal,
    }
  }

  async purchaseCredit({
    user,
    dto,
  }: {
    user: Usuario
    dto: PurchaseItemsStoreDto
  }) {
    const { idCard, deferredMonth, products, methodPay } = dto
    const creditCard = user.creditCards.find((card) => card.id === idCard)
    const isMethodMiles = methodPay === METHOD_PAY.MILES
    const isMethodBitcoin = methodPay === METHOD_PAY.BITCOIN
    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    if (creditCard.status === CardStatus.BLOCKED) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CARD_DISABLED'),
        HttpResponseStatus.CONFLICT
      )
    }

    const { total, formatProductReceipt } =
      await this.getInformationPurchaseProducts({
        methodPay,
        products,
      })

    const receipt = await this.creditCardRepository.manager.transaction(
      async (manager) => {
        let totalPurchase = total
        let installment = 0
        let interestTotal = '0.00'
        if (isMethodBitcoin) {
          const deferredCredit =
            await this.deferredInstallmentService.runCreateQuotas(
              manager,
              creditCard,
              {
                cardId: creditCard.id,
                deferredMonth,
                description: 'BANCA_STORE',
                total,
              }
            )

          const milesEarned = Math.floor(
            deferredCredit.totalAmountWithInterest *
              creditCard.version.mileEarnRate
          )

          await manager
            .getRepository(CreditCard)
            .save({ ...creditCard, miles: creditCard.miles + milesEarned })

          totalPurchase = deferredCredit.totalAmountWithInterest
          installment = deferredCredit.installment
          interestTotal = deferredCredit.interestTotal
        }
        if (isMethodMiles) {
          if (creditCard.miles < total) {
            ThrowHttpException(
              this.i18n.t('tarjetas.INSUF_MILES'),
              HttpResponseStatus.NOT_FOUND
            )
          }
          creditCard.miles = Number(creditCard.miles) - total
          await manager.getRepository(CreditCard).save(creditCard)
        }

        const {
          description,
          valueTotal,
          keyTotal,
          deferredPurchase,
          interestPurchase,
        } = this.dinamicCreateDataReceipt({
          deferredMonth,
          installment,
          interestRate: creditCard.version.interestRate,
          interestTotal,
          isMethodBitcoin,
          methodPay,
          total,
          totalPurchase,
        })

        await manager.getRepository(Movement).save({
          creditCard,
          description,
          title: fullName(user),
          totalBalance: 0,
          typeMovement: TypeMovement.SHOPPING,
          user,
        })

        return await manager.getRepository(Receipt).save({
          dataReceipts: [
            { key: 'payMethod', style: { hr: true } },
            { key: 'typeCard', value: TYPE_CARD.CREDIT.toUpperCase() },
            {
              key: 'numberCard',
              style: { hr: true },
              value: creditCard.cardNumber,
            },
            { key: 'products', style: { hr: true } },
            ...formatProductReceipt,
            ...deferredPurchase,
            ...interestPurchase,
            {
              key: keyTotal,
              value: valueTotal,
            },
          ],
          description,
          title: 'purchaseSuccess',
          user,
        })
      }
    )

    return HttpResponseSuccess(this.i18n.t('store.PURCHASE_SUCCESS'), {
      receiptID: receipt.id,
    })
  }

  async purchaseItemsStore(req, dto: PurchaseItemsStoreDto) {
    const { products, typeCard, idCard } = dto
    const isCredit = typeCard === TYPE_CARD.CREDIT
    const isDebit = typeCard === TYPE_CARD.DEBIT

    const relations = isCredit
      ? [EntitiesType.CREDIT_CARD]
      : [EntitiesType.DEBIT_CARD, EntitiesType.RS_DEBIT_ACCOUNT]

    const where = {
      id: req.user.id,
      ...(!isCredit && {
        debitCard: { id: idCard },
      }),
    }

    const user = await this.userRepository.findOne({
      relations,
      where,
    })

    if (isDebit) {
      return await this.purchaseDebit(user, products)
    }

    return await this.purchaseCredit({ dto, user })
  }
}
