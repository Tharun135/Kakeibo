import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, RefreshControl
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, CATEGORIES, CategoryMeta } from '../../constants/theme';
import {
  currentMonthKey, currentMonthLabel, todayString,
  formatCurrency, computeSpendable, computeSpent, computeRemaining,
  isWeeklyReviewDue, isMonthlyReviewDue
} from '../../utils/dateUtils';
import { getAllExpenses, getIncomeForMonth, getConfig, type Expense } from '../../utils/db';
import SummaryCard from '../../components/SummaryCard';
import ExpenseCard from '../../components/ExpenseCard';
import { deleteExpense } from '../../utils/db';

export default function DashboardScreen() {
  const router = useRouter();
  const [income, setIncome] = useState(0);
  const [savingGoal, setSavingGoal] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [monthLabel, setMonthLabel] = useState('');
  const [config, setConfig] = useState<any>(null);

  const load = useCallback(async () => {
    const monthKey = currentMonthKey();
    setMonthLabel(currentMonthLabel());
    const rec = await getIncomeForMonth(monthKey);
    setIncome(rec?.income ?? 0);
    setSavingGoal(rec?.saving_goal ?? 0);
    const all = await getAllExpenses();
    setExpenses(all);
    const conf = await getConfig();
    setConfig(conf);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const monthKey = currentMonthKey();
  const today = todayString();
  const spendable = computeSpendable(income, savingGoal);
  const spent = computeSpent(expenses, monthKey);
  const remaining = computeRemaining(income, savingGoal, spent);
  const saved = Math.max(0, spendable - spent);
  const burnRatio = spendable > 0 ? Math.min(1, spent / spendable) : 0;
  const todayExpenses = expenses.filter((e) => e.date === today).sort((a, b) => b.amount - a.amount);

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    await load();
  };

  const incomeNotSet = income === 0;

  // Group all expenses of this month by date for the list
  const currentMonthExpenses = expenses
    .filter((e) => e.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>KAKEIBO</Text>
            <Text style={styles.month}>{monthLabel}</Text>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>📒</Text>
          </View>
        </View>

        {/* Review reminders */}
        {isWeeklyReviewDue(config?.weeklyDay ?? 1) && (
          <TouchableOpacity 
            style={[styles.alertBanner, { backgroundColor: Colors.successMuted, borderColor: Colors.success + '44' }]}
            onPress={() => router.push('/weekly')}
          >
            <Text style={[styles.alertText, { color: Colors.success }]}>
              📓 Time for your Weekly Review!
            </Text>
          </TouchableOpacity>
        )}

        {isMonthlyReviewDue(config?.monthlyDate ?? 1) && (
          <TouchableOpacity 
            style={[styles.alertBanner, { backgroundColor: Colors.accentMuted, borderColor: Colors.accent + '44' }]}
            onPress={() => router.push('/monthly')}
          >
            <Text style={[styles.alertText, { color: Colors.accent }]}>
              💰 Time for your Monthly Review!
            </Text>
          </TouchableOpacity>
        )}

        {/* Income not set banner */}
        {incomeNotSet && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ⚙️ Set your monthly income in Settings to get started
            </Text>
          </View>
        )}

        {/* Budget summary cards */}
        <View style={styles.cardsRow}>
          <SummaryCard
            label="Income"
            value={formatCurrency(income)}
          />
          <View style={{ width: Spacing.sm }} />
          <SummaryCard
            label="Savings Goal"
            value={formatCurrency(savingGoal)}
            valueColor={Colors.accent}
          />
        </View>

        {/* Burn bar */}
        <View style={styles.burnCard}>
          <View style={styles.burnHeader}>
            <Text style={styles.burnLabel}>Monthly Spend</Text>
            <Text style={styles.burnPct}>{Math.round(burnRatio * 100)}% used</Text>
          </View>
          <View style={styles.burnTrack}>
            <View
              style={[
                styles.burnFill,
                {
                  width: `${burnRatio * 100}%` as any,
                  backgroundColor: burnRatio > 0.85 ? Colors.danger : burnRatio > 0.65 ? Colors.warning : Colors.accent,
                },
              ]}
            />
          </View>
          <View style={styles.burnFooter}>
            <View>
              <Text style={styles.burnSub}>SPENT</Text>
              <Text style={[styles.burnVal, { color: Colors.danger }]}>{formatCurrency(spent)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.burnSub}>REMAINING</Text>
              <Text style={[styles.burnVal, { color: remaining >= 0 ? Colors.success : Colors.danger }]}>
                {remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        </View>

        {/* Saved tile */}
        <View style={[styles.savedCard, { borderColor: Colors.success + '33' }]}>
          <Text style={styles.savedLabel}>💰 Saved so far this month</Text>
          <Text style={[styles.savedValue, { color: Colors.success }]}>{formatCurrency(saved)}</Text>
          <Text style={styles.savedGoal}>Goal: {formatCurrency(savingGoal)}</Text>
        </View>

        {/* Pending Card Payments Bucket */}
        {expenses.some(e => e.paymentMethod === 'Credit Card' && !e.isSettled) && (
          <View style={styles.bucketCard}>
            <View style={styles.bucketHeader}>
              <Text style={styles.bucketEmoji}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bucketTitle}>Credit Card Payment Bucket</Text>
                <Text style={styles.bucketSub}>Total pending transfer from bank</Text>
              </View>
              <Text style={styles.bucketValue}>
                {formatCurrency(expenses.filter(e => e.paymentMethod === 'Credit Card' && !e.isSettled).reduce((s, e) => s + e.amount, 0))}
              </Text>
            </View>
          </View>
        )}

        {/* Recent activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Spending</Text>
          <Text style={styles.sectionSub}>{formatCurrency(spent)} total</Text>
        </View>

        {currentMonthExpenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyText}>No expenses recorded this month.</Text>
            <Text style={styles.emptyHint}>Tap + to start your KAKEIBO journey.</Text>
          </View>
        ) : (
          currentMonthExpenses.map((e) => (
            <ExpenseCard 
              key={e.id} 
              expense={e} 
              onDelete={handleDelete} 
              onPress={(id) => router.push({ pathname: '/edit-expense', params: { id } })}
            />
          ))
        )}


        {/* Category summary */}
        {expenses.filter((e) => e.date.startsWith(monthKey)).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>This Month by Category</Text>
            {CATEGORIES.map((cat) => {
              const total = expenses.filter((e) => e.date.startsWith(monthKey) && e.category === cat).reduce((s, e) => s + e.amount, 0);
              if (total === 0) return null;
              const meta = CategoryMeta[cat];
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                  <Text style={styles.catName}>{meta.icon} {cat}</Text>
                  <Text style={[styles.catAmt, { color: meta.color }]}>{formatCurrency(total)}</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  month: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  monthBadge: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  monthBadgeText: { fontSize: 24 },
  alertBanner: {
    backgroundColor: Colors.accentMuted, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.accent + '44', padding: Spacing.md, marginBottom: Spacing.md,
  },
  alertText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  cardsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  burnCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  burnHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  burnLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  burnPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  burnTrack: { height: 10, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md },
  burnFill: { height: '100%', borderRadius: Radius.full },
  burnFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  burnSub: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.6 },
  burnVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  savedCard: {
    backgroundColor: Colors.successMuted, borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  savedLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  savedValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy },
  savedGoal: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

  bucketCard: {
    backgroundColor: '#1E2530', borderRadius: Radius.lg, borderWidth: 1,
    borderColor: '#34495E', padding: Spacing.md, marginBottom: Spacing.xl,
  },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bucketEmoji: { fontSize: 24 },
  bucketTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  bucketSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  bucketValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.warning },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.accent },
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.xl, alignItems: 'center',
  },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  catRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  catDot: { width: 8, height: 8, borderRadius: Radius.full, marginRight: Spacing.sm },
  catName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  catAmt: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
