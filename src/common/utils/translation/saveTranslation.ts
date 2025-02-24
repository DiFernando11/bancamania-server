export const saveTranslation = ({
  key,
  args = {},
}: {
  key: string
  args?: Record<string, any>
}): string => {
  const hasArgs = Object.keys(args).length > 0
  return hasArgs ? `${key} - ${JSON.stringify(args)}` : key
}
