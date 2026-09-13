import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { confirmAction, type ConfirmLine } from "../components/ConfirmDialog";
import { formatFullRp } from "../utils/format";
import { maxLoanAmount } from "../engine/banking";
import { formatDateForDay } from "../engine/calendar";
import { Landmark, HandCoins } from "lucide-react";
import { useState, type ReactNode } from "react";

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

            <div className="grid gap-4 sm:grid-cols-2">
              <LenderCard
                icon={<Landmark className="h-5 w-5" />}
                name="Bank"
                badge="Best rate"
                badgeClass="text-jade-300 border-jade-400/50"
                rate="0.1%"
                rateLabel="interest per day"
                dailyInterest={Math.round(loanAmount * 0.001)}
                dueDate={dueDate}
                disabled={loanAmount > maxLoan}
                confirmTitle="Borrow from the bank?"
                description={`Loan of ${formatFullRp(loanAmount)}, due ${dueDate} (day ${currentDay + 30}) at 0.1% interest per day.`}
                lines={[
                  { label: "Daily interest", value: formatFullRp(Math.round(loanAmount * 0.001)) },
                  { label: "Interest over 30 days", value: formatFullRp(Math.round(loanAmount * 0.03)) },
                  { label: "Due date", value: dueDate },
                ]}
                buttonLabel="Borrow from bank"
                buttonClass="bg-ink-900 text-paper-100 hover:bg-ink-700"
                onBorrow={() => actions.takeLoan(loanAmount, "bank")}
                playerCash={playerCash}
                loanAmount={loanAmount}
                tone="good"
              />
              <LenderCard
                icon={<HandCoins className="h-5 w-5" />}
                name="Moneylender"
                badge="No limit checks"
                badgeClass="text-rust-300 border-rust-400/50"
                rate="0.3%"
                rateLabel="interest per day"
                dailyInterest={Math.round(loanAmount * 0.003)}
                dueDate={dueDate}
                disabled={false}
                confirmTitle="Borrow from the moneylender?"
                description={`Loan of ${formatFullRp(loanAmount)}, due ${dueDate} (day ${currentDay + 30}) at 0.3% interest per day.`}
                lines={[
                  { label: "Daily interest", value: formatFullRp(Math.round(loanAmount * 0.003)) },
                  { label: "Interest over 30 days", value: formatFullRp(Math.round(loanAmount * 0.09)) },
                  { label: "Due date", value: dueDate },
                ]}
                buttonLabel="Borrow from moneylender"
                buttonClass="border border-rust-400/60 text-rust-300 hover:bg-rust-400/10"
                onBorrow={() => actions.takeLoan(loanAmount, "moneylender")}
                playerCash={playerCash}
                loanAmount={loanAmount}
                tone="danger"
              />
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

function LenderCard({
  icon,
  name,
  badge,
  badgeClass,
  rate,
  rateLabel,
  dailyInterest,
  dueDate,
  disabled,
  confirmTitle,
  description,
  lines,
  buttonLabel,
  buttonClass,
  onBorrow,
  playerCash,
  loanAmount,
  tone,
}: {
  icon: ReactNode;
  name: string;
  badge: string;
  badgeClass: string;
  rate: string;
  rateLabel: string;
  dailyInterest: number;
  dueDate: string;
  disabled: boolean;
  confirmTitle: string;
  description: string;
  lines: ConfirmLine[];
  buttonLabel: string;
  buttonClass: string;
  onBorrow: () => void;
  playerCash: number;
  loanAmount: number;
  tone?: "good" | "danger";
}) {
  return (
    <div className="flex flex-col border border-ink-600 bg-ink-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="mt-0.5 text-paper-100">{icon}</span>
          <div>
            <p className="font-display text-[16px] text-paper-100">{name}</p>
            <p className="text-[12px] text-mist-400">{rateLabel}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] ${badgeClass}`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-3">
        <p className="font-nums font-display text-2xl text-paper-100">{rate}</p>
        <p className="text-[12px] text-mist-400">per day</p>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-ink-700 pt-3 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-mist-400">Daily interest</span>
          <span className="font-nums text-paper-100">
            {formatFullRp(dailyInterest)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-mist-400">Interest · 30 days</span>
          <span className="font-nums text-paper-100">
            {formatFullRp(Math.round(dailyInterest * 30))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-mist-400">Repayment due</span>
          <span className="font-nums text-paper-100">{dueDate}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={async () => {
          const ok = await confirmAction({
            title: confirmTitle,
            description,
            lines,
            currentCash: playerCash,
            cashChange: loanAmount,
            confirmLabel: "Borrow now",
            tone,
          });
          if (ok) onBorrow();
        }}
        className={`mt-4 w-full py-2.5 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${buttonClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
