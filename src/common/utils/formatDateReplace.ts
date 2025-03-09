import { format, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

export const formatDateReplace = (
  dateInput: Date | string,
  formatStr: string,
  locale: 'es' | 'en' = 'es'
): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput

  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida')
  }

  const locales = { en: enUS, es }

  return format(date, formatStr.replace(/YYYY/g, 'yyyy').replace(/YY/g, 'yy'), {
    locale: locales[locale],
  })
}
