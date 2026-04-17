import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import {
  currentMonthKey, currentMonthLabel, computeSpendable, formatCurrency
} from '../../utils/dateUtils';
import { getIncomeForMonth, saveIncome } from '../../utils/db';

export default function SettingsScreen() {
  const [incomeStr, setIncomeStr] = useState('');
  const [goalStr, setGoalStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [monthKey, setMonthKey] = useState('');
  const [monthLabel, setMonthLabel] = useState('');

  const load = useCallback(async () => {
    const mk = currentMonthKey();
    setMonthKey(mk);
    setMonthLabel(currentMonthLabel());
    const rec = await getIncomeForMonth(mk);
    if (rec) {
      setIncomeStr(String(rec.income));
      setGoalStr(String(rec.saving_goal));
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const income = parseFloat(incomeStr) || 0;
  const savingGoal = parseFloat(goalStr) || 0;
  const spendable = computeSpendable(income, savingGoal);

  const handleSave = async () => {
    if (income <= 0) {
      Alert.alert('Invalid Income', 'Please enter a valid income amount.');
      return;
    }
    if (savingGoal < 0 || savingGoal >= income) {
      Alert.alert('Invalid Goal', 'Savings goal must be between 0 and your income.');
      return;
    }
    setSaving(true);
    try {
      await saveIncome({
        id: monthKey,
        month: monthLabel,
        income,
        saving_goal: savingGoal,
      });
      Alert.alert('✓ Saved', `Budget set for ${monthLabel}.\nSpendable: ${formatCurrency(spendable)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>

        {/* Kakebo guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideIcon}>📒</Text>
          <View style={styles.guideText}>
            <Text style={styles.guideTitle}>Kakebo Method</Text>
            <Text style={styles.guideSub}>
              Set your income and savings goal at the start of the month.
              The remainder is your spendable budget. Track every rupee manually.
            </Text>
          </View>
        </View>

        {/* Income input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MONTHLY INCOME</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              value={incomeStr}
              onChangeText={setIncomeStr}
              keyboardType="numeric"
              placeholder="75000"
              placeholderTextColor={Colors.textMuted}
              maxLength={10}
            />
          </View>
        </View>

        {/* Savings goal input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>SAVINGS GOAL</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              value={goalStr}
              onChangeText={setGoalStr}
              keyboardType="numeric"
              placeholder="15000"
              placeholderTextColor={Colors.textMuted}
              maxLength={10}
            />
          </View>
        </View>

        {/* Auto-calculation */}
        {income > 0 && (
          <View style={styles.calcCard}>
            <Text style={styles.calcTitle}>Budget Breakdown</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Income</Text>
              <Text style={styles.calcValue}>{formatCurrency(income)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Savings Goal</Text>
              <Text style={[styles.calcValue, { color: Colors.accent }]}>- {formatCurrency(savingGoal)}</Text>
            </View>
            <View style={[styles.calcRow, styles.calcTotal]}>
              <Text style={styles.calcTotalLabel}>Spendable</Text>
              <Text style={[styles.calcTotalValue, { color: spendable >= 0 ? Colors.success : Colors.danger }]}>
                {formatCurrency(spendable)}
              </Text>
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Monthly Budget'}</Text>
        </TouchableOpacity>

        {/* Info note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 You can update these values anytime during the month. Your existing expenses will not be affected.
          </Text>
        </View>

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

  guideCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg,
    marginBottom: Spacing.xl, gap: Spacing.md,
  },
  guideIcon: { fontSize: 32 },
  guideText: { flex: 1 },
  guideTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  guideSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    letterSpacing: 1.2, marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: Spacing.md,
  },
  rupee: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.accent, marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingVertical: Spacing.md },

  calcCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  calcTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.8 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  calcLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  calcValue: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  calcTotal: { borderTopWidth: 1, borderTopColor: Colors.cardBorder, marginTop: Spacing.sm, paddingTop: Spacing.md },
  calcTotalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calcTotalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnAccent },

  infoCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
