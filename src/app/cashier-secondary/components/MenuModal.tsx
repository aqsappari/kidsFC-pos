"use client";

import React from "react";
import { BookOpen, Wifi, ChevronLeft, ChevronRight, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMenuPage: number;
  setCurrentMenuPage: React.Dispatch<React.SetStateAction<number>>;
  menuPages: Array<{ title: string; src: string; isQr: boolean }>;
  wifiString: string;
  wifiSsid: string;
  wifiPassword: string;
}

export function MenuModal({
  isOpen,
  onClose,
  currentMenuPage,
  setCurrentMenuPage,
  menuPages,
  wifiString,
  wifiSsid,
  wifiPassword,
}: MenuModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-zinc-950 text-base font-['Montserrat']">
              {menuPages[currentMenuPage].title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-auto p-4 min-h-[450px]">
          {menuPages[currentMenuPage].isQr ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wifi className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-zinc-950 text-lg font-['Montserrat']">
                Free Guest Wi-Fi
              </h4>
              <p className="text-xs text-zinc-500">
                Scan the QR code below with your phone camera to connect
                instantly.
              </p>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl inline-block">
                <QRCodeSVG value={wifiString} size={180} level="H" />
              </div>
              <div className="text-xs font-mono text-zinc-700 bg-zinc-100 px-3 py-2 rounded-xl w-full">
                <span className="text-zinc-500">Network:</span>{" "}
                <strong>{wifiSsid}</strong>
                <br />
                <span className="text-zinc-500">Password:</span>{" "}
                <strong>{wifiPassword}</strong>
              </div>
            </div>
          ) : (
            <img
              src={menuPages[currentMenuPage].src}
              alt="Menu Page"
              className="max-h-[68vh] w-auto object-contain rounded-xl shadow-lg"
            />
          )}

          <button
            onClick={() =>
              setCurrentMenuPage((prev) =>
                prev === 0 ? menuPages.length - 1 : prev - 1,
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() =>
              setCurrentMenuPage((prev) => (prev + 1) % menuPages.length)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 bg-white border-t border-zinc-100 flex items-center justify-center gap-3 shrink-0">
          {menuPages.map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentMenuPage(index)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
                currentMenuPage === index
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Page {index + 1}:{" "}
              {index === 0
                ? "Food & Snacks"
                : index === 2
                  ? "Free WIFI"
                  : "Beverages"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
