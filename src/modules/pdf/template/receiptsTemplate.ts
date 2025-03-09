import { dataReceiptsTemplate } from '@/src/modules/pdf/template/dataReceiptsTemplate'
import { headerReceipts } from '@/src/modules/pdf/template/headerReceipts'

export const receiptsTemplate = ({
  dataReceipts,
  createdAt,
  receiptID,
  title,
}) => {
  return `<div class="receipts">
       ${headerReceipts({
         createdAt,
         receiptID,
         title,
       })}
       ${dataReceiptsTemplate({ dataReceipts })}
      </div>`
}
