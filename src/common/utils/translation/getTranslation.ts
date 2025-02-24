import { I18nService } from 'nestjs-i18n'

export function getTranslation({
  i18n,
  description,
}: {
  i18n: I18nService
  description: string
}): string {
  const [keyPart, argsPart] = description.split(' - ')
  let args = {}

  try {
    args = argsPart ? JSON.parse(argsPart) : {}
  } catch (error) {
    args = {}
  }

  return i18n.t(keyPart.trim(), {
    args,
  })
}
