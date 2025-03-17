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
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { TypeCredit } from '@/src/modules/tarjetas/creditCard/enums/creditEnum'
import {
  cardPrefixNumber,
  InitialVersion,
  NextVersionTypeCard,
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
    private readonly i18n: I18nService,
    private readonly tarjetasService: TarjetasService
  ) {}

  async createCreditCard(req, marca: TypeCredit) {
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.CREDIT_CARD, EntitiesType.ACCOUNT],
      where: { id: req.user.id },
    })

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
      marca,
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

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.CREATE_CREDIT'),
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
    const debitCard = await this.creditCardRepository.findOne({
      where: { id, user: { id: req.user.id } },
    })

    if (!debitCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.DEBIT_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    const nextStatus: Record<CardStatus, CardStatus> = {
      [CardStatus.ACTIVE]: CardStatus.BLOCKED,
      [CardStatus.BLOCKED]: CardStatus.ACTIVE,
    }
    const newStatus = nextStatus[debitCard.status]
    debitCard.status = newStatus
    await this.creditCardRepository.save(debitCard)
    return HttpResponseSuccess(
      this.i18n.t('tarjetas.STATUS_UPDATED'),
      { newStatus },
      HttpResponseStatus.OK
    )
  }
}
