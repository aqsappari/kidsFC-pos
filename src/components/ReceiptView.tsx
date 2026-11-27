import React from "react";
import { QRCodeSVG } from "qrcode.react";

export interface ReceiptData {
  queueNumber: number | string;
  tableNumber: string;
  orderId?: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  paymentMethod: string;
  cashTendered: number;
  changeDue: number;
}

interface ReceiptViewProps {
  order: ReceiptData;
  id?: string;
}

export function ReceiptView({
  order,
  id = "thermal-receipt",
}: ReceiptViewProps) {
  const isTakeout =
    !order.tableNumber ||
    order.tableNumber.toLowerCase().includes("takeout") ||
    order.tableNumber.toLowerCase().includes("walk-in");

  const wifiSsid = process.env.NEXT_PUBLIC_WIFI_SSID || "FREE WIFI V2";
  const wifiPassword = process.env.NEXT_PUBLIC_WIFI_PASSWORD || "fw@21436587";
  const wifiEncryption = process.env.NEXT_PUBLIC_WIFI_ENCRYPTION || "WPA";
  const wifiString = `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;

  return (
    <div
      id={id}
      className="bg-white p-4 rounded-2xl border border-black space-y-2 font-mono text-xs text-black"
      style={{ width: "100%", maxWidth: "100%" }}
    >
      <div className="text-center font-bold pb-2 border-b-2 border-black space-y-1">
        <div className="text-sm font-black tracking-wider uppercase text-black">
          ORDER LIST
        </div>
        <div className="text-[10px] text-black">Official Receipt</div>

        {isTakeout ? (
          <div className="badge-box py-1.5 px-3 rounded-md border-2 border-black bg-white text-black my-1 inline-block">
            <div className="text-[10px] font-bold uppercase tracking-wider">
              TAKEOUT / WALK-IN
            </div>
            <div className="text-base font-black">
              QUEUE #{order.queueNumber}
            </div>
          </div>
        ) : (
          <div className="badge-box py-1.5 px-3 rounded-md border-2 border-black bg-white text-black my-1 inline-block">
            <div className="text-[10px] font-bold uppercase tracking-wider">
              DINE-IN
            </div>
            <div className="text-base font-black uppercase">
              {order.tableNumber}
            </div>
            <div className="text-[11px] font-bold">
              Queue #{order.queueNumber}
            </div>
          </div>
        )}

        {order.orderId && (
          <div className="text-[10px] text-black">
            Order ID: #{order.orderId}
          </div>
        )}
        <div className="text-[10px] font-normal text-black">{order.date}</div>
      </div>

      <div className="space-y-1.5 py-1 border-b border-dashed border-black">
        {order.items.map((item, idx) => {
          const lineTotal = item.unitPrice * item.quantity;
          return (
            <div key={idx} className="flex flex-col text-xs text-black">
              <div className="flex justify-between font-bold">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>₱{lineTotal.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-black pl-2">
                @ ₱{item.unitPrice.toFixed(2)} each
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-1 space-y-1 text-xs text-black">
        <div className="flex justify-between font-black text-sm border-b border-black pb-1">
          <span>TOTAL:</span>
          <span>₱{order.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between uppercase">
          <span>Payment ({order.paymentMethod}):</span>
          <span>₱{order.cashTendered.toFixed(2)}</span>
        </div>
        {order.paymentMethod === "cash" && (
          <div className="flex justify-between">
            <span>Change Due:</span>
            <span>₱{order.changeDue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Tightly Centered Vertical Wi-Fi Section */}
      <div
        className="pt-2 pb-1 border-t border-dashed border-black mt-2 text-center"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          className="font-bold text-[10px] uppercase tracking-wide"
          style={{ margin: "0 0 4px 0" }}
        >
          SCAN FOR FREE WI-FI
        </p>
        <div
          style={{
            margin: "2px 0",
            padding: "2px",
            background: "#fff",
            display: "inline-block",
          }}
        >
          <QRCodeSVG value={wifiString} size={80} level="M" />
        </div>
        <div
          className="text-[10px] font-bold"
          style={{ margin: "4px 0 0 0", lineHeight: "1.3" }}
        >
          <div>SSID: {wifiSsid}</div>
          <div>PASS: {wifiPassword}</div>
        </div>
      </div>

      <div className="text-center text-[10px] text-black pt-2 border-t border-dashed border-black mt-1">
        <p>Thank you for dining with us!</p>
        <p className="font-bold">
          Please keep this receipt for your reference.
        </p>
      </div>
    </div>
  );
}
