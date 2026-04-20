import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, CATEGORIES } from '../../constants/theme';
import {
  currentMonthKey, currentWeekKey, currentWeekRange,
  formatCurrency, computeCategoryTotals
} from '../../utils/dateUtils';
import { getAllExpenses, getReview, saveReview, deleteExpense, type Expense, type Review } from '../../utils/db';
import CategoryBar from '../../components/CategoryBar';
import ReflectionBox from '../../components/ReflectionBox';
import ExpenseCard from '../../components/ExpenseCard';

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [weekKey, setWeekKey] = useState('');
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });

  const load = useCallback(async () => {
    const wk = currentWeekKey();
    const wr = currentWeekRange();
    setWeekKey(wk);
    setWeekRange(wr);
    const all = await getAllExpenses();
    const weekExpenses = all.filter((e) => e.date >= wr.start && e.date <= wr.end);
    setExpenses(weekExpenses);
    const review = await getReview(wk);
    setNotes(review?.notes ?? '');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const saveNotes = async (text: string) => {
    setNotes(text);
    const monthKey = currentMonthKey();
    const review: Review = {
      id: weekKey,
      type: 'weekly',
      month: monthKey,
      notes: text,
      answers: {},
    };
    await saveReview(review);
  };

  const totals = computeCategoryTotals(expenses);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const biggestCat = CATEGORIES.reduce((a, b) => (totals[a] > totals[b] ? a : b));

  const formatDate = (d: string) => {
    if (!d) return '';
    const obj = new Date(d + 'T00:00:00');
    return obj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

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
        <Text style={styles.title}>Weekly Review</Text>
        <Text style={styles.subtitle}>
          {weekRange.start ? `${formatDate(weekRange.start)} – ${formatDate(weekRange.end)}` : ''}
        </Text>

        {/* Total card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent This Week</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalSpent)}</Text>
          {totalSpent > 0 && (
            <Text style={styles.totalHint}>
              Most spent on: {biggestCat} ({formatCurrency(totals[biggestCat])})
            </Text>
          )}
        </View>

        {/* Category bars */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {CATEGORIES.map((cat) => (
            <CategoryBar key={cat} category={cat} amount={totals[cat]} total={totalSpent} />
          ))}
        </View>

        {/* KAKEIBO reflection questions */}
        <View style={styles.questionCard}>
          <Text style={styles.questionIcon}>🪞</Text>
          <Text style={styles.questionTitle}>Reflection Questions</Text>
          <View style={styles.questionList}>
            <Text style={styles.question}>→ Where did you overspend?</Text>
            <Text style={styles.question}>→ Can you reduce spending next week?</Text>
            <Text style={styles.question}>→ Was any of this spending unnecessary?</Text>
          </View>
        </View>

        {/* Notes box */}
        <ReflectionBox
          label="Your weekly notes"
          placeholder="Write honestly. What did you buy that you didn't need? Where did money slip away?"
          value={notes}
          onChangeText={saveNotes}
          minHeight={130}
        />

        {/* Weekly Expenses List */}
        {expenses.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={styles.cardTitle}>Items This Week</Text>
            {expenses.sort((a,b) => b.date.localeCompare(a.date)).map((e) => (
              <ExpenseCard 
                key={e.id} 
                expense={e} 
                onDelete={async (id) => {
                  await deleteExpense(id);
                  await load();
                }} 
                onPress={(id) => router.push({ pathname: '/edit-expense', params: { id } })}
              />
            ))}
          </View>
        )}

        {/* No expenses state */}
        {expenses.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No expenses recorded this week.</Text>
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

  totalCard: {
    backgroundColor: Colors.accentMuted, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.accent + '44', padding: Spacing.xl, marginBottom: Spacing.md, alignItems: 'center',
  },
  totalLabel: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, marginTop: Spacing.xs },
  totalHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },

  questionCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  questionIcon: { fontSize: 28, marginBottom: Spacing.sm },
  questionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  questionList: { gap: Spacing.sm },
  question: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  emptyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.xl, alignItems: 'center',
  },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
