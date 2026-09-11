import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { formatFullRp, formatSignedRp } from "../utils/format";
import { maxLoanAmount } from "../engine/banking";
import { formatDateForDay } from "../engine/calendar";
import { useState } from "react";

export function Bank() {
  const loans = useGameStore((s) => s.loans);
  const playerCash = useGameStore((s) => s.playerCash);
  const creditRating = useGameStore((s) => s.creditRating);
  const currentDay = useGameStore((s) => s.currentDay);
  const startDate = useGameStore((s) => s.startDate);
  const actions = useGameStore((s) => s.actions);

  const [loanAmount, setLoanAmount] = useState(10_000_000);

  const activeLoans = loans.filter((l) => l.status !== "paid");
  const maxLoan = maxLoanAmount(creditRating);
  const dueDate = formatDateForDay(startDate, currentDay + 30);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Financial services</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Bank
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PaperPanel eyebrow="Your profile" title="Credit rating">
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-mist-300">Credit score</p>
              <p className="font-nums font-display text-3xl text-paper-100">
                {creditRating}
              </p>
              <div className="mt-2 h-2 bg-ink-700">
                <div
                  className="h-full bg-brass-400"
                  style={{ width: `${(creditRating / 900) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[12px] text-mist-400">
                {creditRating >= 700
                  ? "Excellent — you qualify for the best rates"
                  : creditRating >= 500
                  ? "Good — standard rates available"
                  : "Poor — limited borrowing options"}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-mist-300">
                Maximum loan amount
              </p>
              <p className="font-nums text-[16px] text-brass-300">
                {formatFullRp(maxLoan)}
              </p>
            </div>
          </div>
        </PaperPanel>

        <PaperPanel eyebrow="Available credit" title="Take a loan">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] text-mist-300">
                Loan amount
              </label>
              <input
                type="number"
                min={1_000_000}
                max={maxLoan}
                step={1_000_000}
                value={loanAmount}
                onChange={(e) =>
                  setLoanAmount(
                    Math.max(1_000_000, Math.min(maxLoan, Number(e.target.value) || 0))
                  )
                }
                className="w-full border border-ink-600 bg-ink-900 px-3 py-2 font-nums text-[15px] text-paper-100 focus:border-brass-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-mist-300">Bank (0.1% daily)</span>
                <button
                  type="button"
                  disabled={loanAmount > maxLoan}
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: "Borrow from the bank?",
                      description: `Loan of ${formatFullRp(loanAmount)}, due ${dueDate} (day ${currentDay + 30}) at 0.1% interest per day.`,
                      lines: [
                        { label: "Daily interest", value: formatFullRp(Math.round(loanAmount * 0.001)) },
                        { label: "Due date", value: dueDate },
                        { label: "Term", value: "30 days" },
                      ],
                      currentCash: playerCash,
                      cashChange: loanAmount,
                      confirmLabel: "Borrow now",
                    });
                    if (ok) actions.takeLoan(loanAmount, "bank");
                  }}
                  className="border border-ink-600 px-3 py-1.5 text-paper-100 hover:bg-ink-900/60 hover:border-brass-400 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Borrow from bank
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-mist-300">
                  Moneylender (0.3% daily)
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: "Borrow from the moneylender?",
                      description: `Loan of ${formatFullRp(loanAmount)}, due ${dueDate} (day ${currentDay + 30}) at 0.3% interest per day.`,
                      lines: [
                        { label: "Daily interest", value: formatFullRp(Math.round(loanAmount * 0.003)) },
                        { label: "Due date", value: dueDate },
                        { label: "Term", value: "30 days" },
                      ],
                      currentCash: playerCash,
                      cashChange: loanAmount,
                      confirmLabel: "Borrow now",
                      danger: true,
                    });
                    if (ok) actions.takeLoan(loanAmount, "moneylender");
                  }}
                  className="border border-rust-400/60 px-3 py-1.5 text-rust-300 hover:bg-rust-400/10"
                >
                  Borrow from moneylender
                </button>
              </div>
            </div>

            <p className="text-[12px] text-mist-400">
              Repayment due {dueDate}. Late payments hurt your credit rating.
            </p>
          </div>
        </PaperPanel>
      </div>

      <ReadoutPanel title="Active loans">
        {activeLoans.length === 0 ? (
          <p className="text-[14px] text-mist-400">No active loans.</p>
        ) : (
          <div className="space-y-4">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className={`border p-4 ${
                  loan.status === "overdue"
                    ? "border-rust-400 bg-rust-500/10"
                    : loan.status === "due_soon"
                    ? "border-brass-400 bg-brass-400/5"
                    : "border-ink-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-[16px] text-paper-100">
                      {loan.type === "bank" ? "Bank Loan" : "Moneylender Loan"}
                    </p>
                    <p className="text-[13px] text-mist-400">
                      {formatFullRp(loan.remaining)} remaining · Due{" "}
                      {formatDateForDay(startDate, loan.dueDay)}
                    </p>
                    {loan.status === "overdue" && (
                      <p className="mt-1 text-[13px] text-rust-400">
                        OVERDUE — credit rating declining
                      </p>
                    )}
                    {loan.status === "due_soon" && (
                      <p className="mt-1 text-[13px] text-brass-300">
                        Payment due soon
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={playerCash < loan.remaining}
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: "Repay this loan in full?",
                        lines: [
                          {
                            label: "Loan type",
                            value: loan.type === "bank" ? "Bank" : "Moneylender",
                          },
                          { label: "Amount due", value: formatFullRp(loan.remaining) },
                        ],
                        currentCash: playerCash,
                        cashChange: -loan.remaining,
                        confirmLabel: "Repay",
                      });
                      if (ok) actions.repayLoan(loan.id);
                    }}
                    className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Repay in full
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ReadoutPanel>
    </div>
  );
}
