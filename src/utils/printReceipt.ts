export function printThermalReceipt(
  receiptElementId: string = "thermal-receipt",
) {
  const receiptContent = document.getElementById(receiptElementId)?.innerHTML;
  if (!receiptContent) {
    console.error("Receipt element not found");
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
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            line-height: 1.25;
            width: 48mm; /* Leaves 5mm total safety margin for 58mm paper */
            margin: 0 auto;
            padding: 2mm 0;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .dash-line {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
            width: 100%;
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
