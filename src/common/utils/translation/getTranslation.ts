import { I18nService } from 'nestjs-i18n'
import { formatDate } from '@/src/common/utils/formatDate'

export function getTranslation({
  i18n,
  description,
  createdAt,
}: {
  i18n: I18nService
  description: string
  createdAt?: Date
}): string {
  const [keyPart, argsPart] = description.split(' - ')
  let args: Record<string, any> = {}

  try {
    args = argsPart ? JSON.parse(argsPart) : {}
  } catch (error) {
    args = {}
  }

  if (!args.date && createdAt) {
    const date = formatDate(createdAt, 'DD MMM')
    args.date = date
  }

  return i18n.t(keyPart.trim(), {
    args,
  })
}
