export enum TypeCredit {
  MASTERCARD = 'mastercard',
  VISA = 'visa',
}

export enum VisaCard {
  CLASSIC = 'Visa Classic',
  GOLD = 'Visa Gold',
  PLATINUM = 'Visa Platinum',
  SIGNATURE = 'Visa Signature',
  INFINITE = 'Visa Infinite',
}

export enum Mastercard {
  STANDARD = 'Mastercard Standard',
  GOLD = 'Mastercard Gold',
  PLATINUM = 'Mastercard Platinum',
  WORLD = 'Mastercard World',
  WORLD_ELITE = 'Mastercard World Elite',
}

export type CreditCardVersion = VisaCard | Mastercard
