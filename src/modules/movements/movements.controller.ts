import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { CreateMovementDto } from '@/src/modules/movements/dto/create-movement.dto'
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
  async getUserMovements(@Req() req: Request) {
    return this.movementService.getUserMovements(req)
  }

  @Get('/months')
  @UseGuards(JwtAuthGuard)
  async getAvailableMonths(@Req() req: Request) {
    return this.movementService.getUserMovementMonths(req)
  }
}
