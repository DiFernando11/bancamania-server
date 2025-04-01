/* eslint max-len: ["off"] */
type StatementEntry = {
  label: string
  value: string
}

type StatementParams = {
  title: string
  cardOwner: string
  dateEmision: string
  dateEnd: string
  totalConsolidatedDebt: string
  tasaInterest: string
  overdueInstallmentsCount: number
  totalLateFees: string
  sectionOneTitle: string
  sectionTwoTitle: string
  interestLabel: string
  emissionDateLabel: string
  cutDateLabel: string
  totalLateFeesLabel: string
  overdueInstallmentsLabel: string
  totalToPayLabel: string
  sectionOne: StatementEntry[]
  sectionTwo: StatementEntry[]
}

export default function generateStatementHTML({
  title,
  cardOwner,
  dateEmision,
  dateEnd,
  totalConsolidatedDebt,
  tasaInterest,
  overdueInstallmentsCount,
  totalLateFees,
  sectionOneTitle,
  sectionTwoTitle,
  interestLabel,
  emissionDateLabel,
  cutDateLabel,
  totalLateFeesLabel,
  overdueInstallmentsLabel,
  totalToPayLabel,
  sectionOne,
  sectionTwo,
}: StatementParams): string {
  const renderSection = (entries: StatementEntry[]) =>
    entries
      .map(
        (e) => `<div class="content"><p>${e.label}</p><p>${e.value}</p></div>`
      )
      .join('')

  return `
    <div>
      <h1 class="title">${title}</h1>
      <p class="cardOwner">${cardOwner}</p>

      <div class="headerTable">${sectionOneTitle}</div>
      <div class="dataContent">
        ${renderSection(sectionOne)}
      </div>

      <div class="headerTable">${sectionTwoTitle}</div>
      <div class="dataContent">
        ${renderSection(sectionTwo)}
      </div>

      <div class="dataCreditContainer">
        <div class="tableCredit">
          <div class="dataCredit"><p class="dataKey">${emissionDateLabel}</p><p>${dateEmision}</p></div>
          <div class="dataCredit"><p class="dataKey">${cutDateLabel}</p><p>${dateEnd}</p></div>
        </div>
        <div class="tableCredit">
          <div class="dataCredit"><p class="dataKey">${interestLabel}</p><p>${tasaInterest}%</p></div>
        </div>
        <div class="tableCredit">
          <div class="dataCredit"><p class="dataKey">${totalLateFeesLabel}</p><p>${totalLateFees}</p></div>
          <div class="dataCredit"><p class="dataKey">${overdueInstallmentsLabel}</p><p>${overdueInstallmentsCount}</p></div>
        </div>
        <div class="totalPurchase">
          <p class="dataKey">${totalToPayLabel}</p>
          <p class="dataKey">${totalConsolidatedDebt}</p>
        </div>
      </div>
    </div>
  `
}
