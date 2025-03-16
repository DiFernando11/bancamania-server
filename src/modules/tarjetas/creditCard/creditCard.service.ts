import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
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
import { TypeCredit } from '@/src/modules/tarjetas/debitCard/enum/typeCredit'
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

    const cardPrefixNumber = {
      [TypeCredit.MASTERCARD]: 5,
      [TypeCredit.VISA]: 3,
    }

    const prefixCard = cardPrefixNumber[marca]

    const newCard = this.creditCardRepository.create({
      cardNumber: generateUniqueNumber(user.id, 16, prefixCard),
      cvv: this.tarjetasService.generateCVV(),
      expirationDate: this.tarjetasService.generateExpirationDate(),
      marca,
      user: user,
    })

    const currentCard = await this.creditCardRepository.save(newCard)

    const movement = this.movementRepository.create({
      creditCard: { id: currentCard.id },
      description: saveTranslation({
        args: {
          date: formatDate(currentCard.createdAt, 'DD MMM'),
          marca,
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
      select: ['id', 'cardNumber', 'marca'],
      where: { user: { id: userId } },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), creditCards)
  }
}
