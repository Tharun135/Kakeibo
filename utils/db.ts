import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ────────────────────────────────────────────────────────────────────
const INCOME_KEY = '@kakebo/income';
const EXPENSES_KEY = '@kakebo/expenses';
const REVIEWS_KEY = '@kakebo/reviews';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface IncomeRecord {
  id: string;      // "YYYY-MM"
  month: string;   // "April 2026"
  income: number;
  saving_goal: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'Needs' | 'Wants' | 'Culture' | 'Unexpected';
  description: string;
  date: string; // "YYYY-MM-DD"
}

export interface Review {
  id: string;      // "YYYY-WNN" or "YYYY-MM"
  type: 'weekly' | 'monthly';
  month: string;   // "YYYY-MM"
  notes: string;
  answers: Record<string, string>;
}

// ─── Income helpers ───────────────────────────────────────────────────────────
export async function getAllIncome(): Promise<IncomeRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(INCOME_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getIncomeForMonth(monthKey: string): Promise<IncomeRecord | null> {
  const all = await getAllIncome();
  return all.find((r) => r.id === monthKey) ?? null;
}

export async function saveIncome(record: IncomeRecord): Promise<void> {
  const all = await getAllIncome();
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(all));
}

// ─── Expense helpers ──────────────────────────────────────────────────────────
export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addExpense(expense: Expense): Promise<void> {
  const all = await getAllExpenses();
  all.push(expense);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
}

export async function deleteExpense(id: string): Promise<void> {
  const all = await getAllExpenses();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
}

// ─── Review helpers ───────────────────────────────────────────────────────────
export async function getAllReviews(): Promise<Review[]> {
  try {
    const raw = await AsyncStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getReview(id: string): Promise<Review | null> {
  const all = await getAllReviews();
  return all.find((r) => r.id === id) ?? null;
}

export async function saveReview(review: Review): Promise<void> {
  const all = await getAllReviews();
  const idx = all.findIndex((r) => r.id === review.id);
  if (idx >= 0) all[idx] = review;
  else all.push(review);
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
}
