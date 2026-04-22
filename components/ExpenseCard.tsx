import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing, CategoryMeta, type Category } from '../constants/theme';
import { formatCurrency, formatDisplayDate } from '../utils/dateUtils';
import type { Expense } from '../utils/db';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
  onSettle?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete, onPress, onSettle }: Props) {

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

  const isCC = expense.paymentMethod === 'Credit Card';
  const isSettled = !!expense.isSettled;

  return (
    <View style={styles.cardContainer}>
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
              {formatDisplayDate(expense.date)} • {isCC ? '💳' : '💵'}
            </Text>
          </View>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          {isCC && (
            <View style={[styles.statusBadge, isSettled ? styles.settledBadge : styles.unsettledBadge]}>
                <Text style={[styles.statusText, isSettled ? styles.settledText : styles.unsettledText]}>
                  {isSettled ? 'SETTLED' : 'UNSETTLED'}
                </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {isCC && !isSettled && onSettle && (
        <TouchableOpacity 
          style={styles.settleQuickBtn} 
          onPress={() => onSettle(expense.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.settleQuickText}>Mark as Transferred to Bank →</Text>
        </TouchableOpacity>
      )}
    </View>
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
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardContainer: {
    marginBottom: Spacing.sm,
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  settledBadge: { backgroundColor: Colors.success + '22' },
  unsettledBadge: { backgroundColor: Colors.danger + '22' },
  statusText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  settledText: { color: Colors.success },
  unsettledText: { color: Colors.danger },

  settleQuickBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginTop: -Radius.md, // overlap slightly to join
    paddingTop: Radius.md + 4,
    zIndex: -1,
  },
  settleQuickText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
