import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing, CATEGORIES, CategoryMeta, type Category } from '../constants/theme';
import { getAllExpenses, updateExpense, deleteExpense } from '../utils/db';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Needs');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card'>('Cash');
  const [isSettled, setIsSettled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchExpense() {
      const all = await getAllExpenses();
      const item = all.find(e => e.id === id);
      if (item) {
        setAmount(item.amount.toString());
        setCategory(item.category as Category);
        setDescription(item.description);
        setDate(item.date);
        setPaymentMethod(item.paymentMethod || 'Cash');
        setIsSettled(item.isSettled ?? (item.paymentMethod === 'Cash'));
      } else {
        Alert.alert('Error', 'Expense not found');
        router.back();
      }
      setLoading(false);
    }
    fetchExpense();
  }, [id]);

  const handleUpdate = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Missing Amount', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description.');
      return;
    }

    setSaving(true);
    try {
      await updateExpense(id, {
        amount: parsed,
        category,
        description: description.trim(),
        date,
        paymentMethod,
        isSettled: paymentMethod === 'Cash' ? true : isSettled,
      });
      Alert.alert('✓ Updated', 'Expense updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteExpense(id);
            router.back();
          } 
        },
      ]
    );
  };

  if (loading) return <View style={styles.root} />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ Close</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit Expense</Text>

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

        {/* Settlement Status (Credit Card Only) */}
        {paymentMethod === 'Credit Card' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SETTLEMENT STATUS</Text>
            <TouchableOpacity
              style={[styles.settleBtn, isSettled && styles.settleBtnActive]}
              onPress={() => setIsSettled(!isSettled)}
              activeOpacity={0.8}
            >
              <Text style={[styles.settleBtnText, isSettled && styles.settleBtnTextActive]}>
                {isSettled ? '✅ Transferred to Card' : '⏳ Pending Transfer from Bank'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.settleHint}>
              Mark this true once you have moved the money from your bank to your CC bill.
            </Text>
          </View>
        )}

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
            placeholder="Description"
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
        </View>

        {/* Update button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.md,
    height: 60,
    alignItems: 'center',
  },
  backBtn: { padding: Spacing.xs },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  deleteBtn: { padding: Spacing.xs },
  deleteBtnText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, marginBottom: Spacing.xl },
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

  settleBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.cardBorder, padding: Spacing.md, alignItems: 'center',
  },
  settleBtnActive: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  settleBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  settleBtnTextActive: { color: Colors.success },
  settleHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  catIcon: { fontSize: 24, marginBottom: Spacing.xs },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  textInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnAccent },
});
