import { IsDateString } from 'class-validator'

export class GenerateStatemensMovementsDto {
  @IsDateString({}, { message: 'DATE_FROM_INVALID' })
  fechaDesde: string
}
