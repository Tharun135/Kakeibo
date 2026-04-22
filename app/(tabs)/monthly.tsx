import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  RefreshControl, KeyboardAvoidingView, Platform,
  Alert, Linking
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { 
  Colors, FontSize, FontWeight, Radius, Spacing, 
  CATEGORIES, CategoryMeta 
} from '../../constants/theme';
import { 
  currentMonthKey, currentMonthLabel,
  formatCurrency, computeSpendable, computeSpent, computeCategoryTotals
} from '../../utils/dateUtils';
import { 
  getAllExpenses, getIncomeForMonth, getReview, saveReview, 
  deleteExpense, updateExpense, type Expense, type Review 
} from '../../utils/db';
import ReflectionBox from '../../components/ReflectionBox';
import ExpenseCard from '../../components/ExpenseCard';

const KAKEIBO_QUESTIONS = [
  { key: 'q1', prompt: '1. What was my income this month?', placeholder: 'Reflect on what you earned...' },
  { key: 'q2', prompt: '2. How much did I save?', placeholder: 'Honest savings amount and why...' },
  { key: 'q3', prompt: '3. How much did I spend unnecessarily?', placeholder: 'Be honest. What could you have skipped?' },
  { key: 'q4', prompt: '4. How can I improve next month?', placeholder: 'One or two specific changes you will make...' },
];

export default function MonthlyReviewScreen() {
  const router = useRouter();
  const [income, setIncome] = useState(0);
  const [savingGoal, setSavingGoal] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [monthKey, setMonthKey] = useState('');
  const [monthLabel, setMonthLabel] = useState('');

  const load = useCallback(async () => {
    const mk = currentMonthKey();
    setMonthKey(mk);
    setMonthLabel(currentMonthLabel());
    const rec = await getIncomeForMonth(mk);
    setIncome(rec?.income ?? 0);
    setSavingGoal(rec?.saving_goal ?? 0);
    const all = await getAllExpenses();
    setExpenses(all);
    const review = await getReview(mk);
    setAnswers(review?.answers ?? {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSettle = async (id: string) => {
    await updateExpense(id, { isSettled: true });
    await load();
  };

  const updateAnswer = async (key: string, text: string) => {
    const updated = { ...answers, [key]: text };
    setAnswers(updated);
    const review: Review = {
      id: monthKey,
      type: 'monthly',
      month: monthKey,
      notes: '',
      answers: updated,
    };
    await saveReview(review);
  };

  const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));
  const spent = computeSpent(expenses, monthKey);
  const spendable = computeSpendable(income, savingGoal);
  const saved = Math.max(0, spendable - spent);
  const catTotals = computeCategoryTotals(monthExpenses);
  const cashTotal = monthExpenses.filter((e) => e.paymentMethod === 'Cash').reduce((s, e) => s + e.amount, 0);
  const creditTotal = monthExpenses.filter((e) => e.paymentMethod === 'Credit Card').reduce((s, e) => s + e.amount, 0);

  const unsettledCC = monthExpenses.filter(e => e.paymentMethod === 'Credit Card' && !e.isSettled);
  const totalUnsettled = unsettledCC.reduce((s, e) => s + e.amount, 0);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Monthly Review</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>

        {/* Stats snapshot */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Month at a Glance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: Colors.accent }]}>{formatCurrency(income)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statValue, { color: Colors.danger }]}>{formatCurrency(spent)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Savings Goal</Text>
              <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{formatCurrency(savingGoal)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>{formatCurrency(saved)}</Text>
            </View>
          </View>
        </View>

        {/* Credit Card Alert */}
        {totalUnsettled > 0 && (
          <View style={styles.debtAlert}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtIcon}>🚨</Text>
              <View>
                <Text style={styles.debtTitle}>Unsettled Monthly Debt</Text>
                <Text style={styles.debtSub}>
                  You have {formatCurrency(totalUnsettled)} unsettled on Credit Card this month.
                  Transfer this to your bank now for precise Kakeibo tracking.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Breakdown */}
        {monthExpenses.length > 0 && (
          <View style={styles.paymentCard}>
            <Text style={styles.catTitle}>Payment Method Analysis</Text>
            <View style={styles.paymentRow}>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>💵 CASH</Text>
                <Text style={styles.paymentValue}>{formatCurrency(cashTotal)}</Text>
              </View>
              <View style={styles.paymentDivider} />
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>💳 CREDIT CARD</Text>
                <Text style={[styles.paymentValue, { color: Colors.warning }]}>{formatCurrency(creditTotal)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category breakdown */}
        {monthExpenses.length > 0 && (
          <View style={styles.catCard}>
            <Text style={styles.catTitle}>Spending Breakdown</Text>
            {CATEGORIES.map((cat) => {
              const amt = catTotals[cat];
              if (amt === 0) return null;
              const meta = CategoryMeta[cat];
              const pct = spent > 0 ? Math.round((amt / spent) * 100) : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catIcon}>{meta.icon}</Text>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catPct}>{pct}%</Text>
                  <Text style={[styles.catAmt, { color: meta.color }]}>{formatCurrency(amt)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* The KAKEIBO 4 Questions */}
        <View style={styles.questionsHeader}>
          <Text style={styles.questionsIcon}>✍️</Text>
          <View>
            <Text style={styles.questionsTitle}>The KAKEIBO Questions</Text>
            <Text style={styles.questionsSubtitle}>Write your answers. Be honest with yourself.</Text>
          </View>
        </View>

        {KAKEIBO_QUESTIONS.map((q) => (
          <ReflectionBox
            key={q.key}
            label={q.prompt}
            placeholder={q.placeholder}
            value={answers[q.key] ?? ''}
            onChangeText={(text) => updateAnswer(q.key, text)}
            minHeight={90}
          />
        ))}

        {/* Expense List for Audit */}
        {monthExpenses.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={styles.catTitle}>Monthly Spending Details</Text>
            {monthExpenses.sort((a,b) => b.date.localeCompare(a.date)).map((e) => (
              <ExpenseCard 
                key={e.id} 
                expense={e} 
                onDelete={async (id) => {
                  await deleteExpense(id);
                  await load();
                }}
                onSettle={handleSettle}
                onPress={(id) => router.push({ pathname: '/edit-expense', params: { id } })}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },

  statsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  statsTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statItem: { width: '45%' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

  paymentCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentItem: { flex: 1, alignItems: 'center' },
  paymentDivider: { width: 1, height: 40, backgroundColor: Colors.cardBorder },
  paymentLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, marginBottom: 4 },
  paymentValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  catCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  catTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  catIcon: { fontSize: 16, marginRight: Spacing.sm },
  catName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  catPct: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.sm },
  catAmt: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  questionsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  questionsIcon: { fontSize: 36 },
  questionsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  questionsSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  debtAlert: {
    backgroundColor: Colors.danger + '12',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger + '33',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  debtIcon: {
    fontSize: 28,
  },
  debtTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    marginBottom: 2,
  },
  debtSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    width: '90%',
  },
});
