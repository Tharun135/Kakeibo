import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import uuid from 'react-native-uuid';
import { Colors, FontSize, FontWeight, Radius, Spacing, CATEGORIES, CategoryMeta, type Category } from '../../constants/theme';
import { todayString } from '../../utils/dateUtils';
import { addExpense } from '../../utils/db';

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Needs');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayString());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card'>('Cash');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Missing Amount', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Describe this expense — KAKEIBO requires manual awareness.');
      return;
    }

    setSaving(true);
    try {
      await addExpense({
        id: uuid.v4() as string,
        amount: parsed,
        category,
        description: description.trim(),
        date,
        paymentMethod,
        isSettled: paymentMethod === 'Cash', // Cash is always "settled"
      });
      // Reset form
      setAmount('');
      setDescription('');
      setDate(todayString());
      setCategory('Needs');
      setPaymentMethod('Cash');
      Alert.alert('✓ Expense Saved', `${description} — ₹${parsed.toLocaleString('en-IN')} recorded.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Text style={styles.title}>Record Expense</Text>
        <Text style={styles.subtitle}>Manual entry is the KAKEIBO way</Text>

        {/* Amount */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              maxLength={10}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
          <View style={styles.toggleRow}>
            {(['Cash', 'Credit Card'] as const).map((method) => {
              const selected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[styles.toggleBtn, selected && styles.toggleBtnActive]}
                  onPress={() => setPaymentMethod(method)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                    {method === 'Cash' ? '💵 Cash' : '💳 Credit Card'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const meta = CategoryMeta[cat];
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catCard,
                    selected && { borderColor: meta.color, backgroundColor: meta.muted },
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.catIcon}>{meta.icon}</Text>
                  <Text style={[styles.catName, selected && { color: meta.color }]}>{cat}</Text>
                  <Text style={styles.catDesc}>{meta.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What did you spend on?"
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
          />
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TextInput
            style={styles.textInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={10}
          />
          <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g., 2026-04-17)</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '+ Save Expense'}</Text>
        </TouchableOpacity>

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

  fieldGroup: { marginBottom: Spacing.xl },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    letterSpacing: 1.2, marginBottom: Spacing.sm,
  },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.accent + '44', paddingHorizontal: Spacing.md,
  },
  currencySign: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.accent, marginRight: Spacing.sm },
  amountInput: { flex: 1, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingVertical: Spacing.md },
  
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.cardBorder, padding: Spacing.md,
    alignItems: 'center',
  },
  toggleBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  toggleText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  toggleTextActive: { color: Colors.accent },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  catIcon: { fontSize: 24, marginBottom: Spacing.xs },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  catDesc: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },

  textInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  dateHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnAccent },
});
