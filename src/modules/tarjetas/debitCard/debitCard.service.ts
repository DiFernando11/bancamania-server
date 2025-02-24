import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  formatDate,
  fullName,
  HttpResponseSuccess,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { TarjetasService } from '@/src/modules/tarjetas/tarjetas.service'
import { Usuario } from '@/src/modules/users/users.entity'
import { DebitCard } from './debitCard.entity'

@Injectable()
export class DebitCardService {
  constructor(
    @InjectRepository(DebitCard)
    private readonly debitCardRepository: Repository<DebitCard>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly i18n: I18nService,
    private readonly tarjetasService: TarjetasService,
    private readonly movements: MovementsService
  ) {}

  async createDebitCard(req) {
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.ACCOUNT, EntitiesType.DEBIT_CARD],
      where: { email: req.email },
    })
    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    if (user.debitCard) {
      ThrowHttpException(
        this.i18n.t('tarjetas.DEBIT_EXISTS'),
        HttpResponseStatus.CONFLICT
      )
    }

    const newCard = this.debitCardRepository.create({
      account: user.account,
      cardNumber: this.tarjetasService.generateCardNumber(),
      cvv: this.tarjetasService.generateCVV(),
      expirationDate: this.tarjetasService.generateExpirationDate(),
      owner: fullName(user),
      user: user,
    })
    const currentCard = await this.debitCardRepository.save(newCard)
    await this.movements.createLastMovement(
      { ...user, debitCard: currentCard },
      {
        description: this.i18n.t('movements.MOV_DEBIT_CREATE', {
          args: { date: formatDate(currentCard.createdAt, 'DD MMM') },
        }),
        relations: [EntitiesType.ACCOUNT, EntitiesType.DEBIT_CARD],
        title: fullName(user),
        typeMovement: TypeMovement.CARD,
      }
    )

    return HttpResponseSuccess(this.i18n.t('tarjetas.CREATE_DEBIT'))
  }

  async getCardDebit(req) {
    const debitCard = await this.debitCardRepository.findOne({
      where: { user: req.id },
    })

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), debitCard)
  }
}
