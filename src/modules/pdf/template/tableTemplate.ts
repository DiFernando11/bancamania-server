export const tableTemplate = ({
  contentTable,
  arrayTittles,
  title,
}: {
  contentTable: string
  arrayTittles: string[]
  title: string
}) => {
  return `
        <div class="tableTitle">
          <p>${title}</p>
        </div>
        <table>
          <thead>
            <tr>
${arrayTittles.map((title) => `<th>${title}</th>`).join('\n')}
            </tr>
          </thead>
          <tbody>
            ${contentTable}
          </tbody>
        </table>`
}
