import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { CreateMovementDto } from '@/src/modules/movements/dto/create-movement.dto'
import { GetUserMovementsDto } from '@/src/modules/movements/dto/get-user-movements.dto'
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
    @Request() req
  ) {
    return this.movementService.getUserMovements(queryParams, req)
  }

  @Get('/months')
  @UseGuards(JwtAuthGuard)
  async getAvailableMonths(@Req() req: Request) {
    return this.movementService.getUserMovementMonths(req)
  }
}
