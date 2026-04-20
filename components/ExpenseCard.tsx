import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing, CategoryMeta, type Category } from '../constants/theme';
import { formatCurrency, formatDisplayDate } from '../utils/dateUtils';
import type { Expense } from '../utils/db';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete, onPress }: Props) {

  const meta = CategoryMeta[expense.category as Category];

  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert(
      'Delete Expense',
      `Remove "${expense.description || expense.category}" — ${formatCurrency(expense.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(expense.id)}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
    >

      <View style={[styles.iconBadge, { backgroundColor: meta.muted }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description || expense.category}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.catPill, { backgroundColor: meta.muted }]}>
            <Text style={[styles.catText, { color: meta.color }]}>{expense.category}</Text>
          </View>
          <Text style={styles.date}>
            {formatDisplayDate(expense.date)} • {expense.paymentMethod === 'Credit Card' ? '💳' : '💵'}
            {expense.paymentMethod === 'Credit Card' && expense.isSettled && ' ✅'}
          </Text>
        </View>
      </View>
      <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  catPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  catText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
});
