import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../constants/theme';
import { formatCurrency } from '../utils/dateUtils';
import { CategoryMeta, type Category } from '../constants/theme';

interface Props {
  category: Category;
  amount: number;
  total: number;  // for progress bar width ratio
}

export default function CategoryBar({ category, amount, total }: Props) {
  const meta = CategoryMeta[category];
  const ratio = total > 0 ? Math.min(1, amount / total) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <Text style={styles.label}>{category}</Text>
        <Text style={[styles.amount, { color: meta.color }]}>{formatCurrency(amount)}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%` as any, backgroundColor: meta.color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  label: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  track: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
