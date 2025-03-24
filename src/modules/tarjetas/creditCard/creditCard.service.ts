import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  formatDate,
  fullName,
  generateUniqueNumber,
  HttpResponseSuccess,
  saveTranslation,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { Movement } from '@/src/modules/movements/movements.entity'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { TypeCredit } from '@/src/modules/tarjetas/creditCard/enums/creditEnum'
import {
  cardPrefixNumber,
  InitialVersion,
  NextVersionTypeCard,
  OffertTypeCard,
} from '@/src/modules/tarjetas/creditCard/utils/credit'
import {
  BENEFIT_WITHOUT_INTEREST,
  INTEREST_CARD,
} from '@/src/modules/tarjetas/enum/cards'
import { CardStatus } from '@/src/modules/tarjetas/enum/cardStatus.enum'
import { TarjetasService } from '@/src/modules/tarjetas/tarjetas.service'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class CreditCardService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly creditCardRepository: Repository<CreditCard>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    private readonly receiptService: ReceiptsService,
    private readonly i18n: I18nService,
    private readonly tarjetasService: TarjetasService
  ) {}

  async createCreditBase(user, marca) {
    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const existingCard = user?.creditCards?.some((card) => card.marca === marca)

    if (existingCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const prefixCard = cardPrefixNumber[marca]
    const version = InitialVersion?.[marca]?.version

    const newCard = this.creditCardRepository.create({
      cardNumber: generateUniqueNumber(user.id, 16, prefixCard),
      cvv: this.tarjetasService.generateCVV(),
      expirationDate: this.tarjetasService.generateExpirationDate(),
      interestRate: INTEREST_CARD[marca],
      marca,
      monthMaxWithoutInterest: BENEFIT_WITHOUT_INTEREST[marca],
      quota: InitialVersion[marca].limit,
      user: user,
      version: InitialVersion[marca].version,
    })

    const currentCard = await this.creditCardRepository.save(newCard)

    const movement = this.movementRepository.create({
      creditCard: { id: currentCard.id },
      description: saveTranslation({
        args: {
          date: formatDate(currentCard.createdAt, 'DD MMM'),
          marca: `${marca} | ${version}`,
        },
        key: 'movements.MOV_CREDIT_CREATE',
      }),
      title: fullName(user),
      totalBalance: user.account?.balance || 0,
      typeMovement: TypeMovement.CARD,
      user: { id: user.id },
    })

    await this.movementRepository.save(movement)
    return newCard
  }

  async createCreditCard(req, marca: TypeCredit) {
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.CREDIT_CARD, EntitiesType.ACCOUNT],
      where: { id: req.user.id },
    })

    await this.createCreditBase(user, marca)

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.CREATE_CREDIT'),
      HttpResponseStatus.CREATED
    )
  }

  async createCreditCardReceipt(req, marca: TypeCredit) {
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.CREDIT_CARD, EntitiesType.ACCOUNT],
      where: { id: req.user.id },
    })

    const newCard = await this.createCreditBase(user, marca)

    const receipt = await this.receiptService.createReceipt({
      dataReceipts: [
        { key: 'owner' },
        {
          key: 'name',
          style: {
            hr: true,
          },
          value: fullName(user),
        },
        { key: 'detailCard' },
        {
          key: 'brand',
          style: {
            hr: true,
          },
          value: newCard.marca,
        },

        { key: 'version', value: newCard.version },
        {
          key: 'limit',
          value: newCard.limit,
        },
      ],
      description: saveTranslation({
        args: {
          date: formatDate(new Date(), 'DD MMM'),
          marca: newCard.marca,
        },
        key: 'movements.MOV_CREDIT_CREATE',
      }),
      title: 'newCard',
      user,
    })

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.CREATE_CREDIT'),
      { receiptID: receipt.id },
      HttpResponseStatus.CREATED
    )
  }

  async getUserCreditCards(req) {
    const userId = req.user.id

    const creditCards = await this.creditCardRepository.find({
      select: ['id', 'cardNumber', 'marca', 'version'],
      where: { user: { id: userId } },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), creditCards)
  }

  async getOffertCredit(req) {
    const userId = req.user.id
    const creditCards = await this.creditCardRepository.find({
      select: ['marca', 'version', 'id', 'limit'],
      where: { user: { id: userId } },
    })

    const availableBrands = [TypeCredit.VISA, TypeCredit.MASTERCARD]

    const offerts = availableBrands.reduce(
      (acc, brand) => {
        const existingCard = creditCards.find((card) => card.marca === brand)

        if (!existingCard) {
          const initialVersionCard = InitialVersion[brand]
          acc.newCards.push({
            id: uuidv4(),
            limit: initialVersionCard.limit,
            marca: brand,
            textOffert: this.i18n.t(`tarjetas.${OffertTypeCard[brand]}`),
            version: initialVersionCard.version,
          })
        } else {
          const nextVersion = NextVersionTypeCard[brand][existingCard.version]
          if (nextVersion) {
            acc.increaseVersion.push({
              currentLimit: existingCard.limit,
              id: existingCard.id,
              marca: brand,
              newLimit: nextVersion.limit,
              version: nextVersion.version,
            })
          }
        }

        return acc
      },
      { increaseVersion: [], newCards: [] }
    )

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), offerts)
  }

  async getCardCreditByUUID(req, id) {
    const creditCard = await this.creditCardRepository.findOne({
      where: { id, user: { id: req.user.id } },
    })

    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), creditCard)
  }

  async updateCreditCardStatus(req, id) {
    const creditCard = await this.creditCardRepository.findOne({
      where: { id, user: { id: req.user.id } },
    })

    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const nextStatus: Record<CardStatus, CardStatus> = {
      [CardStatus.ACTIVE]: CardStatus.BLOCKED,
      [CardStatus.BLOCKED]: CardStatus.ACTIVE,
    }
    const newStatus = nextStatus[creditCard.status]
    creditCard.status = newStatus
    await this.creditCardRepository.save(creditCard)
    return HttpResponseSuccess(
      this.i18n.t('tarjetas.STATUS_UPDATED'),
      { newStatus },
      HttpResponseStatus.OK
    )
  }

  async updateVersion(creditCard) {
    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const nextVersion =
      NextVersionTypeCard[creditCard.marca][creditCard.version]

    if (!nextVersion) {
      ThrowHttpException(
        this.i18n.t('tarjetas.MAX_VERSION_UPDATE'),
        HttpResponseStatus.CONFLICT
      )
    }

    const newCredit = await this.creditCardRepository.save({
      ...creditCard,
      limit: nextVersion.limit,
      version: nextVersion.version,
    })

    const movement = await this.movementRepository.create({
      creditCard: { id: creditCard.id },
      description: saveTranslation({
        args: {
          date: formatDate(new Date(), 'DD MMM'),
          version: nextVersion.version,
        },
        key: 'movements.NEW_VERSION_CREDIT',
      }),
      title: fullName(creditCard.user),
      totalBalance: 0,
      typeMovement: TypeMovement.CARD,
      user: { id: creditCard.user.id },
    })
    await this.movementRepository.save(movement)
    return newCredit
  }

  async upgradeCreditCardVersion(req, id) {
    const creditCard = await this.creditCardRepository.findOne({
      relations: [EntitiesType.USER],
      where: { id, user: { id: req.user.id } },
    })

    const versionUpdate = await this.updateVersion(creditCard)

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.UPGRADE_VERSION_SUCCESS'),
      { limit: versionUpdate.limit, nextVersion: versionUpdate.version },
      HttpResponseStatus.OK
    )
  }

  async createReceiptUpdgradeVersion(req, id) {
    const creditCard = await this.creditCardRepository.findOne({
      relations: [EntitiesType.USER],
      where: { id, user: { id: req.user.id } },
    })
    const versionUpdate = await this.updateVersion(creditCard)
    const receipt = await this.receiptService.createReceipt({
      dataReceipts: [
        { key: 'owner' },
        {
          key: 'name',
          style: {
            hr: true,
          },
          value: fullName(creditCard.user),
        },
        { key: 'detailCard' },
        {
          key: 'brand',
          style: {
            hr: true,
          },
          value: creditCard.marca,
        },

        { key: 'version', value: creditCard.version },
        {
          key: 'limit',
          style: {
            hr: true,
          },
          value: creditCard.limit,
        },
        { key: 'newVersion', value: versionUpdate.version },
        { key: 'newLimit', value: versionUpdate.limit },
      ],
      description: saveTranslation({
        args: {
          date: formatDate(new Date(), 'DD MMM'),
          version: versionUpdate.version,
        },
        key: 'movements.NEW_VERSION_CREDIT',
      }),
      title: 'newVersion',
      user: creditCard.user,
    })

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.UPGRADE_VERSION_SUCCESS'),
      {
        limit: versionUpdate.limit,
        nextVersion: versionUpdate.version,
        receiptID: receipt.id,
      },
      HttpResponseStatus.OK
    )
  }
}
