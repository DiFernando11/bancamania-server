import { Transform } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator'

export class GetPreviewReceiptsDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'LIMIT_NUMBER' })
  limit?: number

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'PAGE_NUMBER' })
  @Min(1, { message: 'PAGE_MIN' })
  page?: number

  @IsOptional()
  @IsDateString({}, { message: 'DATE_FROM_INVALID' })
  fechaDesde?: string

  @IsOptional()
  @IsDateString({}, { message: 'DATE_TO_INVALID' })
  fechaHasta?: string
}
