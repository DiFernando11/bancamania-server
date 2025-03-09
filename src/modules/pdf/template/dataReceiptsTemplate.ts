export const dataReceiptsTemplate = ({
  dataReceipts,
}) => `<div class="dataReceipts">
${dataReceipts
  .map(
    ({ key, value, style }) => `
  <div>
    <div class="keyValue">
      <strong>${key}</strong>
      <p>${value || ''}</p>
    </div>
    ${style?.hr ? '<hr />' : ''}
  </div>
`
  )
  .join('')}
</div>`
