import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class GetDataAccountsDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'PAGE_NUMBER' })
  @Min(1, { message: 'PAGE_MIN' })
  page?: number

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'LIMIT_NUMBER' })
  limit?: number

  @IsOptional()
  @IsString()
  search: string
}
