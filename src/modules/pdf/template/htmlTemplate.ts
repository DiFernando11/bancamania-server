export const htmlTemplate = ({
  style,
  content,
}: {
  style: string
  content: string
}) => {
  return `<html>
      <head>
        <meta charset="utf-8" />
        <style>
         ${style}
        </style>
      </head>
      <body>
       ${content}
      </body>
      </html>`
}
