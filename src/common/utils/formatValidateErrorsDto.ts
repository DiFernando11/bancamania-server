import { ValidationError } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'

export default function formatValidateErrorsDto(
  errors: ValidationError[],
  i18n: I18nService,
  parentPath = ''
): { field: string; errors: string[] }[] {
  return errors.flatMap((error) => {
    const currentPath = parentPath
      ? error.property.match(/^\d+$/)
        ? `${parentPath}[${error.property}]`
        : `${parentPath}.${error.property}`
      : error.property

    const thisLevel = error.constraints
      ? [
          {
            errors: Object.values(error.constraints).map((msg) =>
              i18n.t(`validationDto.${msg}`)
            ),
            field: currentPath,
          },
        ]
      : []

    const childrenLevel =
      error.children && error.children.length > 0
        ? formatValidateErrorsDto(error.children, i18n, currentPath)
        : []

    return [...thisLevel, ...childrenLevel]
  })
}
