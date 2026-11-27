"use client";

import React from "react";

interface TerminalSelectorProps {
  terminalKeys: string[];
  terminalsState: Record<string, any>;
  activeTerminalId: string;
  onSelectTerminal: (tId: string) => void;
}

export function TerminalSelector({
  terminalKeys,
  terminalsState,
  activeTerminalId,
  onSelectTerminal,
}: TerminalSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {terminalKeys.map((tId) => {
        const tData = terminalsState[tId];
        const hasItems = tData?.cart?.length > 0;
        const isReady = tData?.isReadyForCheckout;
        const isSelected = activeTerminalId === tId;
        const isWaiter = tId.toLowerCase().startsWith("waiter");
        const isEmergency = tId.toLowerCase().includes("emergency");

        const buttonLabel = isEmergency
          ? "🚨 Emergency Edit"
          : isWaiter
            ? "Server / Waiter 1"
            : tId.startsWith("table-")
              ? `Table ${tId.split("-")[1]}`
              : tId;

        return (
          <button
            key={tId}
            onClick={() => onSelectTerminal(tId)}
            className={`py-3 px-4 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              isSelected
                ? isReady
                  ? "bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-400 animate-pulse"
                  : "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600"
                : isReady
                  ? "bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-300 animate-bounce"
                  : hasItems
                    ? "bg-amber-50 text-amber-900 border border-amber-300"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span>{buttonLabel}</span>
            {hasItems && (
              <span
                className={`w-2 h-2 rounded-full ${isReady ? "bg-white animate-ping" : "bg-amber-500"}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
