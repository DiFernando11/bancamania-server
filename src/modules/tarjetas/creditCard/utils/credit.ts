import {
  Mastercard,
  TypeCredit,
  VisaCard,
} from '@/src/modules/tarjetas/creditCard/enums/creditEnum'

export const cardPrefixNumber = {
  [TypeCredit.MASTERCARD]: 5,
  [TypeCredit.VISA]: 3,
}

export const INITIAL_LIMIT = '1000'

export const CurrentVersionMasterCard = {
  [Mastercard.STANDARD]: {
    limit: INITIAL_LIMIT,
    version: Mastercard.STANDARD,
  },
}

export const CurrentVersionVisaCard = {
  [VisaCard.CLASSIC]: {
    limit: INITIAL_LIMIT,
    version: VisaCard.CLASSIC,
  },
}

export const InitialVersion = {
  [TypeCredit.MASTERCARD]: CurrentVersionMasterCard[Mastercard.STANDARD],
  [TypeCredit.VISA]: CurrentVersionVisaCard[VisaCard.CLASSIC],
}

export const OffertTypeCard = {
  [TypeCredit.MASTERCARD]: 'MASTER_BENEFIT',
  [TypeCredit.VISA]: 'VISA_BENEFIT',
}
