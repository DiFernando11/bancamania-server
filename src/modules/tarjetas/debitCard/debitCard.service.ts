import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
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
    private readonly tarjetasService: TarjetasService
  ) {}

  async createDebitCard(req) {
    const user = await this.userRepository.findOne({
      relations: ['account', 'debitCard'],
      where: { email: req.email },
    })
    console.log(user, 'DEBIT CARD')
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
      user: user,
    })
    await this.debitCardRepository.save(newCard)

    return HttpResponseSuccess(this.i18n.t('tarjetas.CREATE_DEBIT'))
  }
}
