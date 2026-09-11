import type { Loan, LoanType } from "../types";

const BANK_INTEREST = 0.001;
const MONEYLENDER_INTEREST = 0.003;

export function createLoan(
  type: LoanType,
  amount: number,
  currentDay: number,
  repaymentDays: number
): Loan {
  return {
    id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    principal: amount,
    remaining: amount,
    interestRate: type === "bank" ? BANK_INTEREST : MONEYLENDER_INTEREST,
    dueDay: currentDay + repaymentDays,
    status: "active",
  };
}

export function dailyInterest(loans: Loan[]): number {
  let total = 0;
  for (const loan of loans) {
    if (loan.status === "active" || loan.status === "due_soon") {
      total += Math.round(loan.remaining * loan.interestRate);
    }
  }
  return total;
}

export function tickLoans(loans: Loan[], currentDay: number): Loan[] {
  return loans.map((loan) => {
    if (loan.status === "paid") return loan;

    if (loan.status === "active" && currentDay >= loan.dueDay - 2) {
      return { ...loan, status: "due_soon" as const };
    }
    if (loan.status === "active" && currentDay >= loan.dueDay) {
      return { ...loan, status: "overdue" as const };
    }
    if (loan.status === "due_soon" && currentDay >= loan.dueDay) {
      return { ...loan, status: "overdue" as const };
    }
    return loan;
  });
}

export function repayLoan(
  loan: Loan,
  availableCash: number
): { loan: Loan; paid: number } {
  const due = loan.remaining;
  const paid = Math.min(due, availableCash);
  const remaining = due - paid;
  return {
    loan: {
      ...loan,
      remaining,
      status: remaining <= 0 ? "paid" : loan.status,
    },
    paid,
  };
}

export function maxLoanAmount(creditRating: number): number {
  const base = 10_000_000;
  return Math.round(base * (0.5 + creditRating / 200));
}

export function updateCreditRating(
  current: number,
  loans: Loan[]
): number {
  let score = current;
  const hasOverdue = loans.some((l) => l.status === "overdue");
  const hasDueSoon = loans.some((l) => l.status === "due_soon");
  const activeCount = loans.filter((l) => l.status === "active").length;

  if (hasOverdue) score = Math.max(100, score - 15);
  if (hasDueSoon) score = Math.max(100, score - 5);
  if (activeCount === 0) score = Math.min(900, score + 2);

  return score;
}
