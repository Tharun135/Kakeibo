import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  RefreshControl, KeyboardAvoidingView, Platform,
  Alert, Linking, TouchableOpacity, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { 
  Colors, FontSize, FontWeight, Radius, Spacing, 
  CATEGORIES, CategoryMeta 
} from '../../constants/theme';
import { 
  currentMonthKey, currentMonthLabel, monthLabelFromKey, getPreviousMonth, getNextMonth,
  formatCurrency, computeSpendable, computeSpent, computeCategoryTotals
} from '../../utils/dateUtils';
import { 
  getAllExpenses, getIncomeForMonth, getReview, saveReview, 
  deleteExpense, updateExpense, getConfig, type Expense, type Review 
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
  const [searchQuery, setSearchQuery] = useState('');
  const [ccLimit, setCcLimit] = useState(0);

  // ── Compare mode ─────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false);
  const [cmpMonthKey, setCmpMonthKey] = useState('');
  const [cmpExpenses, setCmpExpenses] = useState<Expense[]>([]);
  const [cmpIncome, setCmpIncome] = useState(0);
  const [cmpSavingGoal, setCmpSavingGoal] = useState(0);

  const load = useCallback(async () => {
    const mk = monthKey || currentMonthKey();
    if (!monthKey) setMonthKey(mk);
    
    setMonthLabel(monthLabelFromKey(mk));
    const rec = await getIncomeForMonth(mk);
    setIncome(rec?.income ?? 0);
    setSavingGoal(rec?.saving_goal ?? 0);
    const all = await getAllExpenses();
    setExpenses(all);
    const review = await getReview(mk);
    setAnswers(review?.answers ?? {});
    const conf = await getConfig();
    setCcLimit(conf.ccLimit ?? 0);
  }, [monthKey]);

  const loadCompare = useCallback(async (cmk: string) => {
    const rec = await getIncomeForMonth(cmk);
    setCmpIncome(rec?.income ?? 0);
    setCmpSavingGoal(rec?.saving_goal ?? 0);
    const all = await getAllExpenses();
    setCmpExpenses(all.filter((e) => e.date.startsWith(cmk)));
  }, []);

  // When compare mode is toggled on, initialise compare month to previous month
  const toggleCompare = () => {
    if (!compareMode) {
      const mk = monthKey || currentMonthKey();
      const prev = getPreviousMonth(mk);
      setCmpMonthKey(prev);
      loadCompare(prev);
    }
    setCompareMode((v) => !v);
  };

  const shiftCmpMonth = (dir: 'prev' | 'next') => {
    const next = dir === 'prev' ? getPreviousMonth(cmpMonthKey) : getNextMonth(cmpMonthKey);
    setCmpMonthKey(next);
    loadCompare(next);
  };

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

  const ccRatio = ccLimit > 0 ? Math.min(1, creditTotal / ccLimit) : 0;
  const ccExceeded = ccLimit > 0 && creditTotal > ccLimit;

  const searchLower = searchQuery.toLowerCase().trim();
  const filteredMonthExpenses = searchLower
    ? monthExpenses.filter(
        (e) =>
          (e.description ?? '').toLowerCase().includes(searchLower) ||
          e.category.toLowerCase().includes(searchLower) ||
          String(e.amount).includes(searchLower)
      )
    : monthExpenses;

  // Compare-month derived values
  const cmpSpent = cmpExpenses.reduce((s, e) => s + e.amount, 0);
  const cmpCatTotals = computeCategoryTotals(cmpExpenses);
  const cmpCash = cmpExpenses.filter(e => e.paymentMethod === 'Cash').reduce((s, e) => s + e.amount, 0);
  const cmpCredit = cmpExpenses.filter(e => e.paymentMethod === 'Credit Card').reduce((s, e) => s + e.amount, 0);

  // Delta helper: positive = current month spent MORE (bad = red), negative = spent less (good = green)
  const delta = (a: number, b: number) => a - b;
  const deltaColor = (d: number) => d > 0 ? Colors.danger : d < 0 ? Colors.success : Colors.textMuted;
  const deltaLabel = (d: number) => {
    if (d === 0) return '=';
    return (d > 0 ? '▲ ' : '▼ ') + formatCurrency(Math.abs(d));
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
        {/* Header with Navigation */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Monthly Review</Text>
            <Text style={styles.subtitle}>{monthLabel}</Text>
          </View>
          
          <View style={styles.navButtons}>
            {/* Compare toggle */}
            <TouchableOpacity
              style={[styles.navBtn, compareMode && styles.navBtnActive]}
              onPress={toggleCompare}
            >
              <Text style={{ fontSize: 18 }}>⚖️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => setMonthKey(getPreviousMonth(monthKey))}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => setMonthKey(getNextMonth(monthKey))}
              disabled={monthKey === currentMonthKey()}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={28} 
                color={monthKey === currentMonthKey() ? Colors.textMuted : Colors.textPrimary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Comparison Panel ───────────────────────────────────────────── */}
        {compareMode && (
          <View style={styles.compareCard}>
            {/* Compare month picker */}
            <View style={styles.cmpPickerRow}>
              <TouchableOpacity style={styles.cmpArrow} onPress={() => shiftCmpMonth('prev')}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.cmpPickerLabel}>
                ⚖️  {monthLabelFromKey(cmpMonthKey) || '…'}
              </Text>
              <TouchableOpacity
                style={styles.cmpArrow}
                onPress={() => shiftCmpMonth('next')}
                disabled={cmpMonthKey === (monthKey || currentMonthKey())}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={cmpMonthKey === (monthKey || currentMonthKey()) ? Colors.textMuted : Colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Column headers */}
            <View style={styles.cmpHeaderRow}>
              <Text style={[styles.cmpCell, { flex: 1.4 }]}>Category</Text>
              <Text style={[styles.cmpCell, styles.cmpColHeader]}>{monthLabelFromKey(monthKey).split(' ')[0]}</Text>
              <Text style={[styles.cmpCell, styles.cmpColHeader]}>{monthLabelFromKey(cmpMonthKey).split(' ')[0]}</Text>
              <Text style={[styles.cmpCell, styles.cmpColHeader]}>Δ</Text>
            </View>

            {/* Total row */}
            <View style={[styles.cmpRow, styles.cmpTotalRow]}>
              <Text style={[styles.cmpCell, styles.cmpRowLabel, { flex: 1.4 }]}>💰 Total</Text>
              <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.danger }]}>{formatCurrency(spent)}</Text>
              <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.warning }]}>{formatCurrency(cmpSpent)}</Text>
              <Text style={[styles.cmpCell, styles.cmpDelta, { color: deltaColor(delta(spent, cmpSpent)) }]}>
                {deltaLabel(delta(spent, cmpSpent))}
              </Text>
            </View>

            {/* Category rows */}
            {CATEGORIES.map((cat) => {
              const a = catTotals[cat];
              const b = cmpCatTotals[cat];
              if (a === 0 && b === 0) return null;
              const d = delta(a, b);
              const meta = CategoryMeta[cat];
              return (
                <View key={cat} style={styles.cmpRow}>
                  <Text style={[styles.cmpCell, styles.cmpRowLabel, { flex: 1.4 }]}>{meta.icon} {cat}</Text>
                  <Text style={[styles.cmpCell, styles.cmpVal, { color: meta.color }]}>{formatCurrency(a)}</Text>
                  <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.textSecondary }]}>{formatCurrency(b)}</Text>
                  <Text style={[styles.cmpCell, styles.cmpDelta, { color: deltaColor(d) }]}>{deltaLabel(d)}</Text>
                </View>
              );
            })}

            {/* Payment method rows */}
            <View style={styles.cmpRow}>
              <Text style={[styles.cmpCell, styles.cmpRowLabel, { flex: 1.4 }]}>💵 Cash</Text>
              <Text style={[styles.cmpCell, styles.cmpVal]}>{formatCurrency(cashTotal)}</Text>
              <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.textSecondary }]}>{formatCurrency(cmpCash)}</Text>
              <Text style={[styles.cmpCell, styles.cmpDelta, { color: deltaColor(delta(cashTotal, cmpCash)) }]}>
                {deltaLabel(delta(cashTotal, cmpCash))}
              </Text>
            </View>
            <View style={styles.cmpRow}>
              <Text style={[styles.cmpCell, styles.cmpRowLabel, { flex: 1.4 }]}>💳 Credit</Text>
              <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.warning }]}>{formatCurrency(creditTotal)}</Text>
              <Text style={[styles.cmpCell, styles.cmpVal, { color: Colors.textSecondary }]}>{formatCurrency(cmpCredit)}</Text>
              <Text style={[styles.cmpCell, styles.cmpDelta, { color: deltaColor(delta(creditTotal, cmpCredit)) }]}>
                {deltaLabel(delta(creditTotal, cmpCredit))}
              </Text>
            </View>

            <Text style={styles.cmpLegend}>🔴 ▲ spent more this month · 🟢 ▼ spent less this month</Text>
          </View>
        )}

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
              <View style={{ flex: 1 }}>
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

        {/* CC Limit Bar */}
        {ccLimit > 0 && (
          <View style={[styles.ccLimitCard, ccExceeded && styles.ccLimitCardExceeded]}>
            <View style={styles.ccLimitHeader}>
              <Text style={styles.ccLimitTitle}>💳 Credit Card Limit</Text>
              {ccExceeded ? (
                <View style={styles.ccExceededBadge}>
                  <Text style={styles.ccExceededBadgeText}>⚠️ EXCEEDED</Text>
                </View>
              ) : (
                <Text style={styles.ccLimitPct}>{Math.round(ccRatio * 100)}% used</Text>
              )}
            </View>
            <View style={styles.burnTrack}>
              <View
                style={[
                  styles.burnFill,
                  {
                    width: `${Math.min(ccRatio * 100, 100)}%` as any,
                    backgroundColor: ccExceeded ? Colors.danger : ccRatio > 0.7 ? Colors.warning : Colors.success,
                  },
                ]}
              />
            </View>
            <View style={styles.burnFooter}>
              <View>
                <Text style={styles.burnSub}>CC SPENT</Text>
                <Text style={[styles.burnVal, { color: ccExceeded ? Colors.danger : Colors.warning }]}>
                  {formatCurrency(creditTotal)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.burnSub}>LIMIT</Text>
                <Text style={[styles.burnVal, { color: Colors.textSecondary }]}>{formatCurrency(ccLimit)}</Text>
              </View>
            </View>
            {ccExceeded && (
              <Text style={styles.ccExceededMsg}>
                You overspent by {formatCurrency(creditTotal - ccLimit)} on Credit Card this month.
              </Text>
            )}
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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by note, category or amount…"
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredMonthExpenses.length === 0 ? (
              <View style={styles.noResultCard}>
                <Text style={styles.noResultIcon}>🔍</Text>
                <Text style={styles.noResultText}>No results for "{searchQuery}"</Text>
                <Text style={styles.noResultHint}>Try a different note, category or amount.</Text>
              </View>
            ) : (
              filteredMonthExpenses.sort((a,b) => b.date.localeCompare(a.date)).map((e) => (
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
              ))
            )}
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
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: Spacing.xl 
  },
  navButtons: { 
    flexDirection: 'row', 
    gap: Spacing.sm,
    marginTop: 4
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },

  // ── Compare Panel ──────────────────────────────────────────────────────────
  compareCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '55',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cmpPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cmpArrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmpPickerLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  cmpHeaderRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Spacing.xs,
  },
  cmpColHeader: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.semibold,
  },
  cmpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder + '66',
  },
  cmpTotalRow: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 0,
    marginBottom: Spacing.xs,
  },
  cmpCell: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  cmpRowLabel: {
    textAlign: 'left',
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  cmpVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  cmpDelta: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  cmpLegend: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

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

  ccLimitCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.warning + '44', padding: Spacing.lg, marginBottom: Spacing.md,
  },
  ccLimitCardExceeded: {
    borderColor: Colors.danger + '88',
    backgroundColor: Colors.danger + '08',
  },
  ccLimitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  ccLimitTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  ccLimitPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  ccExceededBadge: {
    backgroundColor: Colors.danger + '22', borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.danger + '66',
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  ccExceededBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.danger },
  ccExceededMsg: {
    fontSize: FontSize.sm, color: Colors.danger, marginTop: Spacing.sm,
    fontWeight: FontWeight.medium, textAlign: 'center',
  },
  burnTrack: { height: 10, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md },
  burnFill: { height: '100%', borderRadius: Radius.full },
  burnFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  burnSub: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.6 },
  burnVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

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
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    paddingVertical: 0,
  },
  clearBtn: { padding: Spacing.xs, marginLeft: Spacing.xs },
  clearBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },

  noResultCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.xl, alignItems: 'center',
    marginBottom: Spacing.md,
  },
  noResultIcon: { fontSize: 32, marginBottom: Spacing.sm },
  noResultText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  noResultHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
