export const bitcoinSymbol = (balance: any): string => {
  const numericBalance = Number(balance)
  if (isNaN(numericBalance)) return '0.00 ₿'
  return `${numericBalance.toFixed(2)} ₿`
}
