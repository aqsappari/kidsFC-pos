"use client";

import React, { useEffect } from "react";
import { QrCode, Printer, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TableQrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalKeys: string[];
  terminalsState: Record<string, any>;
  origin: string;
}

export function TableQrPrintModal({
  isOpen,
  onClose,
  terminalKeys,
  terminalsState,
  origin,
}: TableQrPrintModalProps) {
  // Filter out only table terminals (e.g. table-1 through table-10)
  const tableKeys = terminalKeys.filter((k) => k.startsWith("table-"));

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups to print table QR codes.");
      return;
    }

    const qrCardsHtml = tableKeys
      .map((tId) => {
        const tData = terminalsState[tId];
        const termUrl = `${origin}/cashier-secondary?u=${encodeURIComponent(tId)}${
          tData?.secretToken
            ? `&token=${encodeURIComponent(tData.secretToken)}`
            : ""
        }`;
        const label = `Table ${tId.split("-")[1]}`;

        return `
          <div class="qr-card">
            <div class="table-title">${label}</div>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(termUrl)}" alt="QR Code" />
            </div>
            <div class="scan-text">Scan to Order & Pay</div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table QR Codes - 2x5 Landscape Sheet</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .sheet-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr); /* 5 columns */
              grid-template-rows: repeat(2, 1fr);    /* 2 rows */
              gap: 8mm; /* Cutting gap */
              width: 277mm;
              height: 190mm;
              box-sizing: border-box;
            }
            .qr-card {
              border: 2px dashed #333;
              border-radius: 8px;
              padding: 6mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: #fff;
              page-break-inside: avoid;
            }
            .table-title {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              margin-bottom: 2mm;
            }
            .qr-container img {
              width: 32mm;
              height: 32mm;
            }
            .scan-text {
              font-size: 10px;
              font-weight: bold;
              margin-top: 2mm;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="sheet-grid">
            ${qrCardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-4xl border border-zinc-100 space-y-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-extrabold text-zinc-950 font-['Montserrat']">
              A4 Landscape (2x5 Grid) QR Sheet Preview ({tableKeys.length}{" "}
              Tables)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Preview Grid (2 rows x 5 columns) */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-5 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
          {tableKeys.map((tId) => {
            const tData = terminalsState[tId];
            const termUrl = `${origin}/cashier-secondary?u=${encodeURIComponent(tId)}${
              tData?.secretToken
                ? `&token=${encodeURIComponent(tData.secretToken)}`
                : ""
            }`;
            const label = `Table ${tId.split("-")[1]}`;

            return (
              <div
                key={tId}
                className="bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-3 flex flex-col items-center justify-center text-center space-y-2 shadow-xs"
              >
                <span className="font-black text-xs uppercase text-zinc-900">
                  {label}
                </span>
                <div className="p-1.5 bg-white rounded-xl border border-zinc-100">
                  <QRCodeSVG value={termUrl} size={85} level="M" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  Scan to Order & Pay
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print 2x5 Landscape Sheet (Enter)
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
