export const InfoBoxTemplate = ({
  infoTitle,
  infoText,
}: {
  infoTitle: string
  infoText: string
}) => {
  return `<div class="infoBox">
          <p class="infoBoxTitle">${infoTitle}</p>
          <p class="infoBoxText">${infoText}</p>
        </div>`
}
