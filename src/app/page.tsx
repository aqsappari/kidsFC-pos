"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ShieldAlert,
  Lock,
  ArrowRight,
  Delete,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Default admin PIN for local setup (changeable later in settings)
  const CORRECT_PIN = "1234";

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);

      // Auto-validate once 4 digits are entered
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          router.push("/admin");
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin("");
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setPinError(false);
  };

  return (
    <main className="min-h-svh flex flex-col items-center justify-center p-6 bg-[#fdfbf7]">
      {/* App Header Branding */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand text-white shadow-lg mb-4">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-dark font-['Montserrat']">
          KIDS <span className="text-secondary">Local</span>
        </h1>
        <p className="text-zinc-600 mt-2 text-sm md:text-base">
          Recipe-based restaurant inventory & point of sale system
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Cashier Terminal Button */}
        <button
          onClick={() => router.push("/cashier")}
          className="group relative flex flex-col items-start p-8 bg-white rounded-3xl border-2 border-zinc-100 shadow-sm hover:shadow-xl hover:border-brand transition-all duration-300 text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 font-['Montserrat']">
            Cashier Terminal
          </h2>
          <p className="text-zinc-500 text-sm mt-1 mb-6">
            Open order-taking screen, select menu items, and process payments.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand group-hover:translate-x-1 transition-transform">
            Launch POS <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Admin Panel Button */}
        <button
          onClick={() => setShowPinModal(true)}
          className="group relative flex flex-col items-start p-8 bg-white rounded-3xl border-2 border-zinc-100 shadow-sm hover:shadow-xl hover:border-secondary transition-all duration-300 text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 font-['Montserrat']">
            Admin Panel
          </h2>
          <p className="text-zinc-500 text-sm mt-1 mb-6">
            Manage ingredients, purchases, recipes, expenses, and reports.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-secondary group-hover:translate-x-1 transition-transform">
            Restricted Access <Lock className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 4-Digit PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-zinc-100">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-brand-dark flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat']">
              Enter Admin PIN
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Default PIN for setup is{" "}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-800">
                1234
              </code>
            </p>

            {/* PIN Dots Display */}
            <div className="flex justify-center gap-3 my-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                    pinError
                      ? "border-danger bg-danger/10 text-danger animate-bounce"
                      : pin.length > index
                        ? "border-brand bg-brand text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-400"
                  }`}
                >
                  {pin.length > index ? "•" : ""}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-danger mb-4">
                Incorrect PIN. Please try again.
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "",
                "0",
                "DEL",
              ].map((btn, idx) => {
                if (btn === "") return <div key={idx} />;
                if (btn === "DEL") {
                  return (
                    <button
                      key={idx}
                      onClick={handleDelete}
                      className="h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-semibold transition-colors cursor-pointer"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleNumberClick(btn)}
                    className="h-12 rounded-xl bg-zinc-50 hover:bg-brand/10 hover:text-brand border border-zinc-100 text-zinc-800 font-bold text-lg transition-colors cursor-pointer shadow-xs"
                  >
                    {btn}
                  </button>
                );
              })}
            </div>

            {/* Close Modal Button */}
            <button
              onClick={() => {
                setShowPinModal(false);
                setPin("");
                setPinError(false);
              }}
              className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
