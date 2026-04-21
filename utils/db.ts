import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ────────────────────────────────────────────────────────────────────
const INCOME_KEY = '@kakeibo/income';
const EXPENSES_KEY = '@kakeibo/expenses';
const REVIEWS_KEY = '@kakeibo/reviews';
const CONFIG_KEY = '@kakeibo/config';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppConfig {
  weeklyReminderHour: number; // 0-23
  weeklyReminderMinute: number; // 0-59
  weeklyDay: number; // 1-7 (1=Sun, 2=Mon... in Expo Notifications)
  monthlyReminderHour: number; // 0-23
  monthlyReminderMinute: number; // 0-59
  monthlyDate: number; // 1-31
  remindersEnabled: boolean;
  biometricEnabled: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  weeklyReminderHour: 20,
  weeklyReminderMinute: 0,
  weeklyDay: 1, // Sunday
  monthlyReminderHour: 9,
  monthlyReminderMinute: 0,
  monthlyDate: 1, // 1st
  remindersEnabled: false,
  biometricEnabled: false,
};

export async function getConfig(): Promise<AppConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  const current = await getConfig();
  const updated = { ...current, ...config };
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
}

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
  paymentMethod: 'Cash' | 'Credit Card';
  isSettled?: boolean; // True if money transferred from bank to CC
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

export async function updateExpense(id: string, updated: Partial<Expense>): Promise<void> {
  const all = await getAllExpenses();
  const idx = all.findIndex((e) => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updated };
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  }
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
