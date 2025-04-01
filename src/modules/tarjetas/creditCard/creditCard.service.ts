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
import { CreditCardVersion } from '@/src/modules/tarjetas/creditCard/creditCardVersions.entity'
import { TypeCredit } from '@/src/modules/tarjetas/creditCard/enums/creditEnum'
import {
  cardPrefixNumber,
  InitialVersion,
  OffertTypeCard,
} from '@/src/modules/tarjetas/creditCard/utils/credit'
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
    @InjectRepository(CreditCardVersion)
    private readonly creditCardVersionRepository: Repository<CreditCardVersion>,
    private readonly receiptService: ReceiptsService,
    private readonly i18n: I18nService,
    private readonly tarjetasService: TarjetasService
  ) {}

  async createCreditBase(user: Usuario, brand) {
    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    const existingCard = user?.creditCards?.some(
      (card) => card.version.brand.name === brand
    )
    if (existingCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const brand_version = await this.creditCardVersionRepository.findOne({
      relations: [EntitiesType.BRAND],
      where: {
        brand: { name: brand },
        name: InitialVersion[brand].version,
      },
    })

    const prefixCard = cardPrefixNumber[brand]

    const newCard = this.creditCardRepository.create({
      cardNumber: generateUniqueNumber(user.id, 16, prefixCard),
      cvv: this.tarjetasService.generateCVV(),
      expirationDate: this.tarjetasService.generateExpirationDate(),
      quota: brand_version.limit,
      user,
      version: brand_version,
    })
    const currentCard = await this.creditCardRepository.save(newCard)
    const movement = this.movementRepository.create({
      creditCard: { id: currentCard.id },
      description: saveTranslation({
        args: {
          brand: `${brand_version.brand.name} | ${brand_version.limit}`,
          date: formatDate(currentCard.createdAt, 'DD MMM'),
        },
        key: 'movements.MOV_CREDIT_CREATE',
      }),
      title: fullName(user),
      totalBalance: 0,
      typeMovement: TypeMovement.CARD,
      user: { id: user.id },
    })
    await this.movementRepository.save(movement)
    return newCard
  }

  async createCreditCard(req, brand: TypeCredit) {
    const user = await this.userRepository.findOne({
      relations: [
        EntitiesType.CREDIT_CARD,
        EntitiesType.RS_CREDIT_VERSION_BRAND,
      ],
      where: { id: req.user.id },
    })

    await this.createCreditBase(user, brand)

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.CREATE_CREDIT'),
      HttpResponseStatus.CREATED
    )
  }

  async createCreditCardReceipt(req, brand: TypeCredit) {
    const user = await this.userRepository.findOne({
      relations: [
        EntitiesType.CREDIT_CARD,
        EntitiesType.RS_CREDIT_VERSION_BRAND,
      ],
      where: { id: req.user.id },
    })
    const newCard = await this.createCreditBase(user, brand)

    const brandCurrent = newCard.version.brand.name
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
          value: brandCurrent,
        },
        { key: 'version', value: newCard.version.name },
        {
          key: 'limit',
          value: newCard.version.limit,
        },
      ],
      description: saveTranslation({
        args: {
          brand: brandCurrent,
          date: formatDate(new Date(), 'DD MMM'),
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
      select: ['id', 'cardNumber', 'version', 'quota', 'miles'],
      where: { user: { id: userId } },
    })

    const creditsFormat = creditCards.map((credit) => ({
      ...credit,
      brand: credit.version.brand.name,
      interestRate: credit.version.interestRate,
      maxInstallmentsWithoutInterest:
        credit.version.maxInstallmentsWithoutInterest,
      miles: credit.miles,
      quota: credit.quota,
      version: credit.version.name,
    }))

    return HttpResponseSuccess(
      this.i18n.t('general.GET_SUCCESS'),
      creditsFormat
    )
  }

  async getOffertCredit(req) {
    const userId = req.user.id
    const creditCards = await this.creditCardRepository.find({
      relations: [EntitiesType.RS_VERSION_NEXTVERSION],
      select: ['version', 'id'],
      where: { user: { id: userId } },
    })

    const availableBrands = [TypeCredit.VISA, TypeCredit.MASTERCARD]
    const offerts = availableBrands.reduce(
      (acc, brand) => {
        const existingCard = creditCards.find(
          (card) => card.version.brand.name === brand
        )
        if (!existingCard) {
          const initialVersionCard = InitialVersion[brand]
          acc.newCards.push({
            brand,
            id: uuidv4(),
            limit: initialVersionCard.limit,
            textOffert: this.i18n.t(`tarjetas.${OffertTypeCard[brand]}`),
            version: initialVersionCard.version,
          })
        } else {
          const nextVersion = existingCard.version.nextVersion
          if (nextVersion) {
            acc.increaseVersion.push({
              brand,
              currentLimit: existingCard.version.limit,
              id: existingCard.id,
              newLimit: nextVersion.limit,
              version: nextVersion.name,
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

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      ...creditCard,
      brand: creditCard.version.brand.name,
      limit: creditCard.version.limit,
      version: creditCard.version.name,
    })
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

  async updateVersion(creditCard: CreditCard) {
    if (!creditCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const nextVersion = creditCard.version.nextVersion

    if (!nextVersion) {
      ThrowHttpException(
        this.i18n.t('tarjetas.MAX_VERSION_UPDATE'),
        HttpResponseStatus.CONFLICT
      )
    }
    const currentUsedQuota = creditCard.version.limit - creditCard.quota

    const newCredit = await this.creditCardRepository.save({
      ...creditCard,
      quota: nextVersion.limit - currentUsedQuota,
      version: nextVersion,
    })
    const movement = await this.movementRepository.create({
      creditCard: { id: creditCard.id },
      description: saveTranslation({
        args: {
          date: formatDate(new Date(), 'DD MMM'),
          version: nextVersion.name,
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
      relations: [EntitiesType.USER, EntitiesType.RS_VERSION_NEXTVERSION],
      where: { id, user: { id: req.user.id } },
    })

    const versionUpdate = await this.updateVersion(creditCard)
    return HttpResponseSuccess(
      this.i18n.t('tarjetas.UPGRADE_VERSION_SUCCESS'),
      {
        limit: versionUpdate.version.limit,
        nextVersion: versionUpdate.version.name,
      },
      HttpResponseStatus.OK
    )
  }

  async createReceiptUpdgradeVersion(req, id) {
    const creditCard = await this.creditCardRepository.findOne({
      relations: [EntitiesType.USER, EntitiesType.RS_VERSION_NEXTVERSION],
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
          value: creditCard.version.brand.name,
        },
        { key: 'version', value: creditCard.version.name },
        {
          key: 'limit',
          style: {
            hr: true,
          },
          value: creditCard.version.limit,
        },
        { key: 'newVersion', value: versionUpdate.version.name },
        { key: 'newLimit', value: versionUpdate.version.limit },
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
        limit: versionUpdate.version.limit,
        nextVersion: versionUpdate.version.name,
        receiptID: receipt.id,
      },
      HttpResponseStatus.OK
    )
  }
}
