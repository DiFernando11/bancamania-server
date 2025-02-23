export function formatDate(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, '0')
  const monthNumber = (date.getMonth() + 1).toString().padStart(2, '0')
  const monthShort = date
    .toLocaleString('es-ES', { month: 'short' })
    .replace('.', '')
  const monthLong = date.toLocaleString('es-ES', { month: 'long' })
  const yearFull = date.getFullYear().toString()
  const yearShort = yearFull.slice(-2)

  const patterns: Record<string, string> = {
    DD: day,
    MM: monthNumber,
    MMM: monthShort,
    MMMM: monthLong,
    YY: yearShort,
    YYYY: yearFull,
  }

  return format.replace(
    /DD|MMMM|MMM|MM|YYYY|YY/g,
    (match) => patterns[match] || match
  )
}
