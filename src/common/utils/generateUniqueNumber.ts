export function generateUniqueNumber(
  id: number,
  totalLength: number = 10,
  prefix: number = 1
): string {
  const idLength = id.toString().length
  const remainingLength = totalLength - idLength - 1
  const baseNumber = prefix * Math.pow(10, remainingLength) + id

  return baseNumber.toString()
}
