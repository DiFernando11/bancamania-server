// src/movements/dto/create-movement.dto.ts
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'

export class CreateMovementDto {
  @IsOptional()
  @IsNumber({}, { message: 'BALANCE_NUMBER' })
  balance?: number

  @IsString({ message: 'TITLE_STRING' })
  @IsNotEmpty({ message: 'TITLE_REQUIRED' })
  title: string

  @IsString({ message: 'DESCRIPTION_STRING' })
  @IsNotEmpty({ message: 'DESCRIPTION_REQUIRED' })
  description: string
  @IsEnum(TypeMovement, {
    message: 'TYPE_MOVEMENT_INVALID',
  })
  typeMovement: TypeMovement

  @IsOptional()
  @IsArray({ message: 'RELATIONS_ARRAY' })
  @ArrayUnique({ message: 'RELATIONS_UNIQUE' })
  @IsIn(['account', 'debitCard'], {
    each: true,
    message: 'RELATIONS_INVALID',
  })
  relations?: string[]
}
