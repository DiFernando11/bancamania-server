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
import { MovementsService } from '@/src/modules/movements/movements.service'
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
    private readonly i18n: I18nService,
    private readonly tarjetasService: TarjetasService,
    private readonly movements: MovementsService
  ) {}

  async createCreditCard(req, marca) {
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
    if (user.creditCard && marca === user.creditCard.marca) {
      ThrowHttpException(
        this.i18n.t('tarjetas.CREDIT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const newCard = this.creditCardRepository.create({
      cardNumber: generateUniqueNumber(user.id, 16, 3),
      cvv: this.tarjetasService.generateCVV(),
      expirationDate: this.tarjetasService.generateExpirationDate(),
      marca,
      user: user,
    })

    const currentCard = await this.creditCardRepository.save(newCard)

    await this.movements.createLastMovement(
      { ...user, creditCard: currentCard },
      {
        description: saveTranslation({
          args: {
            date: formatDate(currentCard.createdAt, 'DD MMM'),
            marca,
          },
          key: 'movements.MOV_CREDIT_CREATE',
        }),
        relations: [EntitiesType.ACCOUNT, EntitiesType.CREDIT_CARD],
        title: fullName(user),
        totalBalance: user.account.balance,
        typeMovement: TypeMovement.CARD,
      }
    )

    return HttpResponseSuccess(
      this.i18n.t('tarjetas.CREATE_CREDIT'),
      HttpResponseStatus.CREATED
    )
  }
}
