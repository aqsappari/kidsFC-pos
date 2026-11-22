export function printThermalReceipt(
  receiptElementId: string = "thermal-receipt",
) {
  const element = document.getElementById(receiptElementId);
  const receiptContent = element?.innerHTML;

  if (!receiptContent) {
    console.error("Receipt element not found with ID:", receiptElementId);
    alert("Receipt element not found. Please try again.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) {
    alert("Please allow popups for this website to enable printing.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          * {
            color: #000 !important;
            border-color: #000 !important;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            line-height: 1.25;
            width: 48mm;
            margin: 0 auto;
            padding: 2mm 0;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .text-base { font-size: 15px; line-height: 1.2; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .text-\\[11px\\] { font-size: 11px; }
          .text-\\[10px\\] { font-size: 10px; }
          .badge-box {
            display: block;
            border: 2px solid #000;
            padding: 4px 6px;
            margin: 6px 0;
            text-align: center;
          }
          .border-b-2 {
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .border-b {
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .border-t {
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-top: 6px;
          }
          .flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
          }
          .flex-col {
            display: flex;
            flex-direction: column;
            margin-bottom: 5px;
          }
          .pl-2 {
            padding-left: 8px;
            font-size: 10px;
          }
          .py-1 { padding: 3px 0; }
          .mt-2 { margin-top: 6px; }
          .mb-2 { margin-bottom: 6px; }
        </style>
      </head>
      <body>
        ${receiptContent}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
