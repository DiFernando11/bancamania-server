export function generateUniqueNumber(
  id: number,
  totalLength: number = 10,
  prefix: number = 1
): string {
  const idString = id.toString()
  const prefixString = prefix.toString()
  const remainingLength = totalLength - idString.length - prefixString.length

  if (remainingLength < 0) {
    const newId = id - Math.pow(10, idString.length - 1)
    return generateUniqueNumber(newId, totalLength, prefix + 1)
  }

  const paddedNumber = prefixString + '0'.repeat(remainingLength) + idString

  return paddedNumber
}
