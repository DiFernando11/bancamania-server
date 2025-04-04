/* eslint-disable max-len */
export const headerReceipts = ({
  title,
  receiptID,
  createdAt,
}) => `<h1>BANCAMANIA</h1>
        <div class="containerHeader">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g fill="#14ce81">
                <path d="M12,3.25A8.75,8.75,0,1,0,20.75,12,8.77,8.77,0,0,0,12,3.25ZM16.7,10l-5,5a.75.75,0,0,1-1.06,0L7.3,11.7a.75.75,0,0,1,0-1.06.74.74,0,0,1,1.06,0l2.81,2.8L15.64,9A.75.75,0,1,1,16.7,10Z"/>
              </g>
            </svg>
          <h2>${title}</h2>
          <p>${receiptID}</p>
        </div>
        <p>${createdAt}</p>`
