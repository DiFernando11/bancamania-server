import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Between, Equal, LessThanOrEqual, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import {
  createFilterDate,
  createPaginationData,
  formatDate,
  getTranslation,
  HttpResponseError,
  HttpResponseSuccess,
  ThrowHttpException,
} from '@/src/common/utils'
import { CreateMovementDto } from '@/src/modules/movements/dto/create-movement.dto'
import { GetUserMovementsDto } from '@/src/modules/movements/dto/get-user-movements.dto'
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
      where: { id: req.user.id },
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

  async getUserMovements(queryParams: GetUserMovementsDto, req) {
    try {
      const { accountId, debitCardId, limit, page, fechaDesde, fechaHasta } =
        queryParams

      const filters: any = {
        user: { id: req.user.id },
        ...(accountId && { account: Equal(accountId) }),
        ...(debitCardId && { debitCard: Equal(debitCardId) }),
        ...createFilterDate(fechaDesde, fechaHasta),
      }
      const { skip, take, createResponse } = createPaginationData({
        limit,
        page,
      })
      const [movements, total] = await this.movementRepository.findAndCount({
        order: {
          createdAt: 'DESC',
        },
        skip,
        take,
        where: { user: { id: req.user.id }, ...filters },
      })

      const translatedMovements = movements.map((movement) => {
        return {
          ...movement,
          description: getTranslation({
            description: movement.description,
            i18n: this.i18n,
          }),
        }
      })

      return HttpResponseSuccess(null, {
        ...createResponse(total),
        movements: translatedMovements,
      })
    } catch (error) {
      return HttpResponseError(error.message)
    }
  }

  async getUserMovementMonths(req) {
    console.log('mas motn', 'MONTHS')
    const { accountId, debitCardId } = req.query

    let query = this.movementRepository
      .createQueryBuilder('movement')
      .select([
        `TO_CHAR(DATE_TRUNC('month', movement.createdAt), 'YYYY-MM-DD') as id`,
      ])
      .where('movement.userId = :userId', { userId: req.user.id })

    if (accountId) {
      query = query.andWhere('movement.accountId = :accountId', { accountId })
    }

    if (debitCardId) {
      query = query.andWhere('movement.debitCardId = :debitCardId', {
        debitCardId,
      })
    }

    const months = await query
      .groupBy(`TO_CHAR(DATE_TRUNC('month', movement.createdAt), 'YYYY-MM-DD')`)
      .orderBy(`MAX(movement.createdAt)`, 'DESC')
      .limit(12)
      .getRawMany()

    const formatMont = months.map((m) => ({
      id: m.id,
      text: formatDate(m.id, 'MMMM YYYY', req.i18nLang),
    }))

    return HttpResponseSuccess(null, formatMont)
  }
}
