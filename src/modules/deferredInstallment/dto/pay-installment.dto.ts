import { IsNumber, Min } from 'class-validator'

export class PayInstallmentsDto {
  @IsNumber({}, { message: 'IS_NUMBER' })
  @Min(0.01, { message: 'IS_GREATER_ZERO' })
  amount: number
}
