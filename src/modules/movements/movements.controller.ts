import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { formatDate } from '@/src/common/utils'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import {
  CreateMovementDto,
  GenerateStatemensMovementsDto,
  GetUserMovementsDto,
} from '@/src/modules/movements/dto'
import { MovementsService } from '@/src/modules/movements/movements.service'

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementService: MovementsService) {}
  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createMovement(@Req() req: Request, @Body() body: CreateMovementDto) {
    return this.movementService.createMovement(req, body)
  }

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUserMovements(
    @Query() queryParams: GetUserMovementsDto,
    @Req() req
  ) {
    return this.movementService.getUserMovements(queryParams, req)
  }

  @Get('/months')
  @UseGuards(JwtAuthGuard)
  async getAvailableMonths(@Req() req: Request) {
    return this.movementService.getUserMovementMonths(req)
  }

  @Get('/pdf/statement')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(
    @Query() queryParams: GenerateStatemensMovementsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const pdfBuffer = await this.movementService.generateStatementPdf(
        queryParams,
        req
      )
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="statement-${formatDate(queryParams.fechaDesde, 'MMM-YYYY')}"`
      )
      res.end(pdfBuffer)
    } catch (error) {
      res
        .status(500)
        .json({ message: `Error al generar el PDF: ${error.message}` })
    }
  }
}
