import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { CreateMovementDto } from '@/src/modules/movements/dto/create-movement.dto'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly i18n: I18nService
  ) {}

  async createLastMovement(user: Usuario, movementData: CreateMovementDto) {
    console.log(user, 'USER')
    const movement = this.movementRepository.create({
      ...movementData,
      account: user?.account,
      debitCard: user?.debitCard,
      user,
    })

    return await this.movementRepository.save(movement)
  }

  async createMovement(req, movementData: CreateMovementDto) {
    const { relations, ...rest } = movementData

    const user = await this.userRepository.findOne({
      relations,
      where: { email: req.email },
    })

    if (!user) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }
    await this.createLastMovement(user, rest)

    return HttpResponseSuccess(this.i18n.t('movements.CREATE_MOVE'))
  }
}
