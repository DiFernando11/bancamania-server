import { TypeCredit } from '@/src/modules/tarjetas/creditCard/enums/creditEnum'

export enum TYPE_CARD {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum METHOD_PAY {
  BITCOIN = 'BITCOIN',
  MILES = 'MILES',
}

export enum INTEREST {
  MASTERCARD = 0.03,
  VISA = 0.025,
}
export const INTEREST_CARD = {
  [TypeCredit.MASTERCARD]: INTEREST.MASTERCARD,
  [TypeCredit.VISA]: INTEREST.VISA,
}

export const BENEFIT_WITHOUT_INTEREST = {
  [TypeCredit.MASTERCARD]: 6,
  [TypeCredit.VISA]: 1,
}
