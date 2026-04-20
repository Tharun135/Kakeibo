// Date and calculation utilities for KAKEIBO

// ─── Month ────────────────────────────────────────────────────────────────────
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentMonthLabel(): string {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function monthLabelFromKey(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ─── Week ─────────────────────────────────────────────────────────────────────
export function currentWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Returns [start, end] of the current ISO week as YYYY-MM-DD strings */
export function currentWeekRange(): { start: string; end: string } {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: toDateString(mon),
    end: toDateString(sun),
  };
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayString();
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

// ─── Budget math ──────────────────────────────────────────────────────────────
export function computeSpendable(income: number, savingGoal: number): number {
  return Math.max(0, income - savingGoal);
}

export function computeSpent(expenses: { amount: number; date: string }[], monthKey: string): number {
  return expenses
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function computeSaved(income: number, savingGoal: number, spentThisMonth: number): number {
  const spendable = computeSpendable(income, savingGoal);
  return Math.max(0, spendable - spentThisMonth);
}

export function computeRemaining(income: number, savingGoal: number, spentThisMonth: number): number {
  const spendable = computeSpendable(income, savingGoal);
  return spendable - spentThisMonth;
}

export function computeCategoryTotals(
  expenses: { amount: number; category: string }[]
): Record<string, number> {
  const totals: Record<string, number> = {
    Needs: 0,
    Wants: 0,
    Culture: 0,
    Unexpected: 0,
  };
  for (const e of expenses) {
    if (e.category in totals) totals[e.category] += e.amount;
  }
  return totals;
}
