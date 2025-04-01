import { IsString, Matches } from 'class-validator'

export class GenerateStatementDto {
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'PERIDO_NOT_FOUND',
  })
  period: string
}
