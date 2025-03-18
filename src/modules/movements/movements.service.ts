import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { format, lastDayOfMonth, parse } from 'date-fns'
import { Request } from 'express'
import { I18nService } from 'nestjs-i18n'
import { Equal, Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { PromiseApiResponse } from '@/src/common/types'
import {
  createFilterDate,
  createPaginationData,
  formatDate,
  getTranslation,
  HttpResponseError,
  HttpResponseSuccess,
  ThrowHttpException,
} from '@/src/common/utils'
import { EntitiesType } from '@/src/enum/entities.enum'
import {
  CreateMovementDto,
  GenerateStatemensMovementsDto,
  GetUserMovementsDto,
} from '@/src/modules/movements/dto'
import { Movement } from '@/src/modules/movements/movements.entity'
import {
  GetUserMovementsResponse,
  Movements,
} from '@/src/modules/movements/types'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import {
  headerTemplate,
  htmlTemplate,
  InfoBoxTemplate,
  tableTemplate,
} from '@/src/modules/pdf/template'
import { tableCss } from '@/src/modules/pdf/template/css'
import { Usuario } from '@/src/modules/users/users.entity'

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly i18n: I18nService,
    private readonly pdfService: PdfService
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

  async getUserMovements(
    queryParams: GetUserMovementsDto,
    req
  ): PromiseApiResponse<GetUserMovementsResponse> {
    try {
      const {
        accountId,
        debitCardId,
        creditCardId,
        limit,
        page,
        fechaDesde,
        fechaHasta,
      } = queryParams

      const filters: any = {
        user: { id: req.user.id },
        ...(accountId && { account: Equal(accountId) }),
        ...(debitCardId && { debitCard: Equal(debitCardId) }),
        ...(creditCardId && { creditCard: { id: creditCardId } }),
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
        where: filters,
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

  async getUserMovementsByMonth(
    queryParams: GetUserMovementsDto,
    req: Request
  ): Promise<Movements[]> {
    if (queryParams.fechaDesde) {
      const fechaDesde = parse(queryParams.fechaDesde, 'yyyy-MM-dd', new Date())
      queryParams.fechaHasta = format(lastDayOfMonth(fechaDesde), 'yyyy-MM-dd')
    }
    queryParams.limit = 0
    const movimientos = await this.getUserMovements(queryParams, req)
    return movimientos.data.movements
  }

  async generateStatementPdf(
    queryParams: GenerateStatemensMovementsDto,
    req
  ): Promise<Buffer> {
    const user = await this.userRepository.findOne({
      relations: [EntitiesType.ACCOUNT],
      where: { id: req.user.id },
    })

    if (!user || !user.account) {
      ThrowHttpException(
        this.i18n.t('general.USER_NOT_FOUND'),
        HttpResponseStatus.NOT_FOUND
      )
    }

    ;(queryParams as any).accountId = user.account.id

    const movimientos = await this.getUserMovementsByMonth(queryParams, req)

    const filasTabla = movimientos
      .map(
        (mov) => `
          <tr>
            <td>${formatDate(mov.createdAt, 'DD-MMM')}</td>
            <td>${mov.id}</td>
            <td>${mov.description}</td>
            <td>${mov.balance}</td>
            <td>${mov.totalBalance}</td>
          </tr>
        `
      )
      .join('')

    const htmlContent = htmlTemplate({
      content: ` <div class="container">
    ${headerTemplate({ subtitle: this.i18n.t('movements.STATEMENT') })}
    ${InfoBoxTemplate({
      infoText: this.i18n.t('general.ACCOUNT_NUMBER', {
        args: { number: user.account.accountNumber },
      }),
      infoTitle: user.account.owner.toUpperCase(),
    })}
    ${tableTemplate({
      arrayTittles: [
        this.i18n.t('general.DATE'),
        this.i18n.t('general.N_DOC'),
        this.i18n.t('general.DESCRIPTION'),
        this.i18n.t('general.DEBIT'),
        this.i18n.t('general.BALANCE'),
      ],
      contentTable: filasTabla,
      title: this.i18n.t('movements.DETAIL_MOVEMENT'),
    })}
      </div>`,
      style: tableCss,
    })

    return this.pdfService.generatePdfBuffer(htmlContent)
  }
}
