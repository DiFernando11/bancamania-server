import {
  Mastercard,
  TypeCredit,
  VisaCard,
} from '@/src/modules/tarjetas/creditCard/enums/creditEnum'

export const cardPrefixNumber = {
  [TypeCredit.MASTERCARD]: 5,
  [TypeCredit.VISA]: 3,
}

export const INITIAL_LIMIT = 1000

export const TypeOffert = {
  HIRE_CARD: 2,
  UPDATE_VERSION: 1,
}

export const CurrentVersionMasterCard: Record<
  Mastercard,
  { limit: number; version: Mastercard }
> = {
  [Mastercard.STANDARD]: {
    limit: INITIAL_LIMIT,
    version: Mastercard.STANDARD,
  },
  [Mastercard.GOLD]: {
    limit: 5000,
    version: Mastercard.GOLD,
  },
  [Mastercard.PLATINUM]: {
    limit: 10000,
    version: Mastercard.PLATINUM,
  },
  [Mastercard.WORLD]: {
    limit: 20000,
    version: Mastercard.WORLD,
  },
  [Mastercard.WORLD_ELITE]: {
    limit: 50000,
    version: Mastercard.WORLD_ELITE,
  },
}

export const CurrentVersionVisaCard = {
  [VisaCard.CLASSIC]: {
    limit: INITIAL_LIMIT,
    version: VisaCard.CLASSIC,
  },
  [VisaCard.GOLD]: { limit: 5000, version: VisaCard.GOLD },
  [VisaCard.PLATINUM]: {
    limit: 10000,
    version: VisaCard.PLATINUM,
  },
  [VisaCard.SIGNATURE]: {
    limit: 25000,
    version: VisaCard.SIGNATURE,
  },
  [VisaCard.INFINITE]: {
    limit: 75000,
    version: VisaCard.INFINITE,
  },
}

export const InitialVersion = {
  [TypeCredit.MASTERCARD]: CurrentVersionMasterCard[Mastercard.STANDARD],
  [TypeCredit.VISA]: CurrentVersionVisaCard[VisaCard.CLASSIC],
}

export const NextVersionMasterCard = {
  [Mastercard.STANDARD]: CurrentVersionMasterCard[Mastercard.GOLD],
  [Mastercard.GOLD]: CurrentVersionMasterCard[Mastercard.PLATINUM],
  [Mastercard.PLATINUM]: CurrentVersionMasterCard[Mastercard.WORLD],
  [Mastercard.WORLD]: CurrentVersionMasterCard[Mastercard.WORLD_ELITE],
}

export const NextVersionVisaCard = {
  [VisaCard.CLASSIC]: CurrentVersionVisaCard[VisaCard.GOLD],
  [VisaCard.GOLD]: CurrentVersionVisaCard[VisaCard.PLATINUM],
  [VisaCard.PLATINUM]: CurrentVersionVisaCard[VisaCard.SIGNATURE],
  [VisaCard.SIGNATURE]: CurrentVersionVisaCard[VisaCard.INFINITE],
}

export const NextVersionTypeCard = {
  [TypeCredit.MASTERCARD]: NextVersionMasterCard,
  [TypeCredit.VISA]: NextVersionVisaCard,
}

export const OffertTypeCard = {
  [TypeCredit.MASTERCARD]: 'MASTER_BENEFIT',
  [TypeCredit.VISA]: 'VISA_BENEFIT',
}
