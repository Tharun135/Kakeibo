import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, Linking,
  Animated, Pressable, Modal, FlatList, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import {
  currentMonthKey, currentMonthLabel, computeSpendable, formatCurrency
} from '../../utils/dateUtils';
import { getIncomeForMonth, saveIncome, getConfig, saveConfig } from '../../utils/db';
import { requestNotificationPermissions, scheduleKakeiboReminders, cancelKakeiboReminders } from '../../utils/notificationUtils';
import * as LocalAuthentication from 'expo-local-authentication';

const DAYS = [
  { label: 'SUN', value: 1 },
  { label: 'MON', value: 2 },
  { label: 'TUE', value: 3 },
  { label: 'WED', value: 4 },
  { label: 'THU', value: 5 },
  { label: 'FRI', value: 6 },
  { label: 'SAT', value: 7 },
];

const DATES = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ label: (i * 5).toString().padStart(2, '0'), value: i * 5 }));

import AnalogClockPicker from '../../components/AnalogClockPicker';

export default function SettingsScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim]);

  const triggerFlip = () => {
    flipAnim.setValue(0);
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [incomeStr, setIncomeStr] = useState('');
  const [goalStr, setGoalStr] = useState('');
  
  const [weeklyHour, setWeeklyHour] = useState('20');
  const [weeklyMinute, setWeeklyMinute] = useState('0');
  const [weeklyDay, setWeeklyDay] = useState('1');
  
  const [monthlyHour, setMonthlyHour] = useState('9');
  const [monthlyMinute, setMonthlyMinute] = useState('0');
  const [monthlyDate, setMonthlyDate] = useState('1');

  const [dayModal, setDayModal] = useState(false);
  const [dateModal, setDateModal] = useState(false);
  const [showingTimePicker, setShowingTimePicker] = useState<'weekly' | 'monthly' | null>(null);

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricHardwareAvailable, setIsBiometricHardwareAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthKey, setMonthKey] = useState('');
  const [monthLabel, setMonthLabel] = useState('');

  const PickerModal = ({ visible, data, onSelect, onClose, title }: any) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.value || item)}
            renderItem={({ item }) => {
              const label = item.label || String(item);
              const val = item && typeof item === 'object' && 'value' in item ? item.value : item;
              return (
                <TouchableOpacity 
                   style={styles.modalItem} 
                   onPress={() => { onSelect(val); onClose(); }}
                >
                  <Text style={styles.modalItemText}>{label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const onTimeSelect = (h: number, m: number) => {
    if (showingTimePicker === 'weekly') {
      setWeeklyHour(String(h));
      setWeeklyMinute(String(m));
    } else if (showingTimePicker === 'monthly') {
      setMonthlyHour(String(h));
      setMonthlyMinute(String(m));
    }
    setShowingTimePicker(null);
  };

  const load = useCallback(async () => {
    const mk = currentMonthKey();
    setMonthKey(mk);
    setMonthLabel(currentMonthLabel());
    const rec = await getIncomeForMonth(mk);
    if (rec) {
      setIncomeStr(String(rec.income));
      setGoalStr(String(rec.saving_goal));
    }
    const config = await getConfig();
    setWeeklyHour(String(config.weeklyReminderHour));
    setWeeklyMinute(String(config.weeklyReminderMinute));
    setWeeklyDay(String(config.weeklyDay));
    setMonthlyHour(String(config.monthlyReminderHour));
    setMonthlyMinute(String(config.monthlyReminderMinute));
    setMonthlyDate(String(config.monthlyDate));
    setRemindersEnabled(config.remindersEnabled);
    setBiometricEnabled(config.biometricEnabled);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricHardwareAvailable(hasHardware && isEnrolled);
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

      const wh = parseInt(weeklyHour);
      const wm = parseInt(weeklyMinute);
      const wd = parseInt(weeklyDay);
      const mh = parseInt(monthlyHour);
      const mm = parseInt(monthlyMinute);
      const md = parseInt(monthlyDate);

      if (
        isNaN(wh) || wh < 0 || wh > 23 || isNaN(wm) || wm < 0 || wm > 59 || isNaN(wd) || wd < 1 || wd > 7 ||
        isNaN(mh) || mh < 0 || mh > 23 || isNaN(mm) || mm < 0 || mm > 59 || isNaN(md) || md < 1 || md > 31
      ) {
        Alert.alert('Invalid Time/Date', 'Please check your schedule values.');
      } else {
        await saveConfig({ 
          weeklyReminderHour: wh, 
          weeklyReminderMinute: wm, 
          weeklyDay: wd,
          monthlyReminderHour: mh, 
          monthlyReminderMinute: mm,
          monthlyDate: md,
          remindersEnabled,
        });

        // Reschedule if enabled so changes take effect
        if (remindersEnabled) {
          await scheduleKakeiboReminders(wh, wm, wd, mh, mm, md);
        }
      }

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

        {/* KAKEIBO guide */}
        <View style={styles.guideCard}>
          <Pressable 
            onPress={triggerFlip}
            onHoverIn={Platform.OS === 'web' ? triggerFlip : undefined}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotateY }] }}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color={Colors.accent} />
            </Animated.View>
          </Pressable>
          <View style={styles.guideText}>
            <Text style={styles.guideTitle}>KAKEIBO Method</Text>
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

        {/* Reminders */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text style={styles.fieldLabel}>NOTIFICATIONS</Text>
          <View style={styles.remindersCard}>
            <View style={styles.remindersInfo}>
              <Text style={styles.remindersTitle}>Review Schedules</Text>
              <Text style={styles.remindersSub}>Tap Enable to schedule alerts at your preferred time.</Text>
              
              <View style={styles.timeInputsRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Weekly Day</Text>
                  <TouchableOpacity 
                    style={styles.pickerBox} 
                    onPress={() => setDayModal(true)}
                  >
                    <Text style={styles.pickerText}>
                      {DAYS.find(d => d.value === parseInt(weeklyDay))?.label || 'SUN'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.timeInputBox, { marginTop: 4 }]}
                    onPress={() => setShowingTimePicker('weekly')}
                  >
                    <Text style={styles.timeInput}>{weeklyHour.padStart(2, '0')}</Text>
                    <Text style={styles.timeSeparator}>:</Text>
                    <Text style={styles.timeInput}>{weeklyMinute.padStart(2, '0')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Monthly Date</Text>
                  <TouchableOpacity 
                    style={styles.pickerBox} 
                    onPress={() => setDateModal(true)}
                  >
                    <Text style={styles.pickerText}>{monthlyDate}</Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.timeInputBox, { marginTop: 4 }]}
                    onPress={() => setShowingTimePicker('monthly')}
                  >
                    <Text style={styles.timeInput}>{monthlyHour.padStart(2, '0')}</Text>
                    <Text style={styles.timeSeparator}>:</Text>
                    <Text style={styles.timeInput}>{monthlyMinute.padStart(2, '0')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <PickerModal 
                visible={dayModal} 
                data={DAYS} 
                title="Select Weekly Day"
                onSelect={(v: any) => setWeeklyDay(String(v))}
                onClose={() => setDayModal(false)}
              />
              <PickerModal 
                visible={dateModal} 
                data={DATES} 
                title="Select Monthly Date"
                onSelect={(v: any) => setMonthlyDate(String(v))}
                onClose={() => setDateModal(false)}
              />

              <AnalogClockPicker
                visible={showingTimePicker !== null}
                initialHours={parseInt((showingTimePicker === 'weekly' ? weeklyHour : monthlyHour) || '0')}
                initialMinutes={parseInt((showingTimePicker === 'weekly' ? weeklyMinute : monthlyMinute) || '0')}
                onClose={() => setShowingTimePicker(null)}
                onSelect={onTimeSelect}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.remindersToggleBtn, remindersEnabled && styles.remindersToggleBtnActive]}
              onPress={async () => {
                if (remindersEnabled) {
                  // Disable logic
                  await cancelKakeiboReminders();
                  await saveConfig({ remindersEnabled: false });
                  setRemindersEnabled(false);
                  Alert.alert('✓ Reminders Disabled', 'You will no longer receive review notifications.');
                } else {
                  // Enable logic
                  const wh = parseInt(weeklyHour);
                  const wm = parseInt(weeklyMinute);
                  const wd = parseInt(weeklyDay);
                  const mh = parseInt(monthlyHour);
                  const mm = parseInt(monthlyMinute);
                  const md = parseInt(monthlyDate);
                  
                  if (
                    isNaN(wh) || wh < 0 || wh > 23 || isNaN(wm) || wm < 0 || wm > 59 || isNaN(wd) || wd < 1 || wd > 7 ||
                    isNaN(mh) || mh < 0 || mh > 23 || isNaN(mm) || mm < 0 || mm > 59 || isNaN(md) || md < 1 || md > 31
                  ) {
                    Alert.alert('Invalid Time/Date', 'Please check your schedule values.');
                    return;
                  }

                  const granted = await requestNotificationPermissions();
                  if (granted || Platform.OS === 'web') {
                    const result = await scheduleKakeiboReminders(wh, wm, wd, mh, mm, md);
                    if (result.success || Platform.OS === 'web') {
                      await saveConfig({ 
                        weeklyReminderHour: wh, 
                        weeklyReminderMinute: wm, 
                        weeklyDay: wd,
                        monthlyReminderHour: mh, 
                        monthlyReminderMinute: mm,
                        monthlyDate: md,
                        remindersEnabled: true 
                      });
                      setRemindersEnabled(true);
                      if (Platform.OS === 'web') {
                        Alert.alert('✓ Setting Saved', 'Your custom schedule is saved!');
                      } else {
                        Alert.alert('✓ Reminders Scheduled', 'Your reviews are set.');
                      }
                    } else {
                      const msg = Platform.OS === 'android' 
                        ? 'The app could not register the alerts. Please check if "Notifications" and "Alarms & Reminders" are allowed for KAKEIBO in your Android settings.'
                        : 'The app could not register the alerts. Please check your notification settings.';
                      
                      Alert.alert(
                        result.error || 'Scheduling Error',
                        result.details || msg,
                        [
                          { text: 'OK', style: 'default' },
                          { 
                            text: 'Open Settings', 
                            onPress: () => Linking.openSettings()
                          }
                        ]
                      );
                    }
                  } else {
                    Alert.alert(
                      'Permission Denied', 
                      'Please enable notifications in your device settings.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                      ]
                    );
                  }
                }
              }}
            >
              <Text style={[styles.remindersToggleText, remindersEnabled && styles.remindersToggleTextActive]}>
                {remindersEnabled ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security / Biometrics */}
        {isBiometricHardwareAvailable && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={styles.fieldLabel}>SECURITY</Text>
            <View style={styles.remindersCard}>
              <View style={styles.remindersInfo}>
                <Text style={styles.remindersTitle}>Biometric Lock</Text>
                <Text style={styles.remindersSub}>Require fingerprint or face ID to open the app.</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={async (value) => {
                  if (value) {
                    // Try to authenticate before enabling
                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: 'Confirm Biometrics',
                    });
                    if (result.success) {
                      await saveConfig({ biometricEnabled: true });
                      setBiometricEnabled(true);
                    }
                  } else {
                    await saveConfig({ biometricEnabled: false });
                    setBiometricEnabled(false);
                  }
                }}
                trackColor={{ false: '#333', true: Colors.accent }}
                thumbColor={biometricEnabled ? '#FFF' : '#AAA'}
              />
            </View>
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
  
  remindersCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md, gap: Spacing.md,
  },
  remindersInfo: { flex: 1 },
  remindersTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  remindersSub: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  remindersToggleBtn: { backgroundColor: Colors.accentMuted, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent + '44' },
  remindersToggleBtnActive: { backgroundColor: Colors.danger + '22', borderColor: Colors.danger + '44' },
  remindersToggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.accent },
  remindersToggleTextActive: { color: Colors.danger },
  
  timeInputsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  timeCol: { flex: 1 },
  timeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, marginBottom: 2, textTransform: 'uppercase' },
  timeInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 6, paddingVertical: 2 },
  timeInput: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', padding: 0, minWidth: 20 },
  timeSeparator: { fontSize: FontSize.sm, color: Colors.textMuted, marginHorizontal: 1, fontWeight: FontWeight.bold },
  
  pickerBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, 
    borderColor: Colors.cardBorder, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm 
  },
  pickerText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  pickerArrow: { color: Colors.accent, fontSize: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.surface, borderRadius: Radius.lg, width: '100%', maxHeight: 400, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  modalTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, textAlign: 'center' },
  modalItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder + '22', alignItems: 'center' },
  modalItemText: { fontSize: FontSize.md, color: Colors.textPrimary },
});
