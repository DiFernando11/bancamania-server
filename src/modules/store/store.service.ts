import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { In, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  bitcoinSymbol,
  createPaginationData,
  formatDate,
  fullName,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { Account } from '@/src/modules/account/account.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'
import { CreateItemStoreDto } from '@/src/modules/store/dto/createItemStore.dto'
import { PurchaseItemsStoreDto } from '@/src/modules/store/dto/purchaseItemStore.dto'
import { Store } from '@/src/modules/store/store.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { DebitCard } from '@/src/modules/tarjetas/debitCard/debitCard.entity'
import {
  BENEFIT_WITHOUT_INTEREST,
  INTEREST_CARD,
  TYPE_CARD,
} from '@/src/modules/tarjetas/enum/cards'
import { CardStatus } from '@/src/modules/tarjetas/enum/cardStatus.enum'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
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
    const { totalWithInterest, formatProductReceipt } =
      await this.getInformationPurchaseProducts({ interestMonth: 0, products })
    return await this.accountRepository.manager.transaction(
      async (transactionalEntityManager) => {
        if (user.debitCard.status === CardStatus.BLOCKED) {
          ThrowHttpException(
            this.i18n.t('account.CARD_DISABLED'),
            HttpResponseStatus.NOT_FOUND
          )
        }
        if (totalWithInterest > user.debitCard.account.balance) {
          ThrowHttpException(
            this.i18n.t('account.INSUFFICIENT_BALANCE'),
            HttpResponseStatus.NOT_FOUND
          )
        }

        const rawBalance = user.debitCard.account.balance - totalWithInterest
        const balance = Math.ceil(rawBalance * 100) / 100

        await transactionalEntityManager
          .getRepository(Account)
          .update({ id: user.debitCard.account.id }, { balance })

        await transactionalEntityManager.getRepository(Movement).save({
          account: user.debitCard.account,
          debitCard: user.debitCard,
          description: saveTranslation({
            args: { balance: bitcoinSymbol(totalWithInterest) },
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
              { key: 'total', value: bitcoinSymbol(totalWithInterest) },
            ],
            description: saveTranslation({
              args: { balance: bitcoinSymbol(totalWithInterest) },
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

  async getInformationPurchaseProducts({ products, interestMonth }) {
    const productIds = products.map((p) => p.id)

    const productsArray = await this.storeRepository.findBy({
      id: In(productIds),
    })

    const formatProductReceipt = productsArray.flatMap((item) => {
      const productQuantity = products.find((pr) => pr.id === item.id)
      return [
        {
          key: item.title,
        },
        {
          key: 'quantity',
          value: productQuantity.quantity,
        },
        {
          key: 'valueUnit',
          value: bitcoinSymbol(item.price),
        },
        {
          key: 'totalItem',
          style: {
            hr: true,
          },
          value: bitcoinSymbol(item.price * productQuantity.quantity),
        },
      ]
    })

    const total = products.reduce((acc, item) => {
      const product = productsArray.find((p) => p.id === item.id)
      if (!product) return acc

      return acc + product.price * item.quantity
    }, 0)

    const interestTotal = total * interestMonth
    const totalWithInterest = total + interestTotal

    return { formatProductReceipt, totalWithInterest }
  }

  async purchaseCredit({
    user,
    dto,
  }: {
    user: Usuario
    dto: PurchaseItemsStoreDto
  }) {
    const { idCard, deferredMonth, products } = dto
    const creditCard = user.creditCards.find((card) => card.id === idCard)
    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    const interest = creditCard.version.interestRate
    const monthsWithoutInteret =
      creditCard.version.maxInstallmentsWithoutInterest
    const interestMonth =
      deferredMonth > monthsWithoutInteret ? deferredMonth * interest : 0
    await this.getInformationPurchaseProducts({ interestMonth, products })
    return HttpResponseSuccess(this.i18n.t('store.PURCHASE_SUCCESS'), {
      receiptID: '12',
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

    // LA DE CREDITO
    // MIRAR EL PAGO MENSUAL
    // ACTUALIZAR EL CUPO TOTAL - LO QUE GASTO
    // MIRAR COMO PODEMOS MOSTRARLE LO QUE DEBE PAGAR MENSUALMENTE
    // CREAR UN COMPROBANTE
    // CREAR UN MOVIMIENTO
    // REVISAR EL ESTADO DE CUENTA

    return HttpResponseSuccess(
      this.i18n.t('store.CREATE_SUCCESS'),
      { ...user },
      HttpResponseStatus.CREATED
    )
  }
}
