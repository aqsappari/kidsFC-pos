import React from "react";

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
  return (
    <div
      id={id}
      className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-2 font-mono text-xs text-zinc-900"
      style={{ width: "100%", maxWidth: "100%" }}
    >
      <div className="text-center font-bold pb-2 border-b border-zinc-300 space-y-0.5">
        <div className="text-sm font-extrabold tracking-wider uppercase">
          KIDS CAFE & RESTO
        </div>
        <div className="text-[10px] text-zinc-500">Official Receipt</div>
        <div className="text-xs font-bold bg-zinc-100 text-zinc-900 py-0.5 px-2 rounded-md inline-block my-1">
          Queue #{order.queueNumber} • {order.tableNumber}
        </div>
        {order.orderId && (
          <div className="text-[10px] text-zinc-400">
            Order ID: #{order.orderId}
          </div>
        )}
        <div className="text-[10px] font-normal text-zinc-500">
          {order.date}
        </div>
      </div>

      <div className="space-y-1.5 py-1 border-b border-dashed border-zinc-300">
        {order.items.map((item, idx) => {
          const lineTotal = item.unitPrice * item.quantity;
          return (
            <div key={idx} className="flex flex-col text-xs text-zinc-800">
              <div className="flex justify-between font-bold">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>₱{lineTotal.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-zinc-500 pl-2">
                @ ₱{item.unitPrice.toFixed(2)} each
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-1 space-y-1 text-xs">
        <div className="flex justify-between font-extrabold text-sm border-b border-zinc-200 pb-1">
          <span>TOTAL:</span>
          <span className="text-emerald-700">₱{order.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-zinc-600 uppercase">
          <span>Payment ({order.paymentMethod}):</span>
          <span>₱{order.cashTendered.toFixed(2)}</span>
        </div>
        {order.paymentMethod === "cash" && (
          <div className="flex justify-between text-zinc-600">
            <span>Change Due:</span>
            <span>₱{order.changeDue.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-dashed border-zinc-300 mt-2">
        <p>Thank you for dining with us!</p>
        <p className="font-bold">
          Please keep this receipt for your reference.
        </p>
      </div>
    </div>
  );
}
