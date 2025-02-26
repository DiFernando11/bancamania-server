export function formatDate(
  dateInput: Date | string,
  format: string,
  locale: 'es' | 'en' = 'es'
): string {
  let date: Date

  if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number)
    date = new Date(Date.UTC(year, month - 1, day))
  } else {
    date = dateInput
  }

  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida')
  }

  const lang = locale === 'es' ? 'es-ES' : 'en-US'

  const day = date.getUTCDate().toString().padStart(2, '0')
  const monthNumber = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const monthShort = new Intl.DateTimeFormat(lang, {
    month: 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .replace('.', '')
  const monthLong = new Intl.DateTimeFormat(lang, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date)
  const yearFull = date.getUTCFullYear().toString()
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
