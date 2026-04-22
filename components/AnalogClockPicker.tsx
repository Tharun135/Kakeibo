import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, 
  TouchableOpacity, PanResponder, Platform 
} from 'react-native';
import { Colors, Radius, Spacing, FontWeight } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (hours: number, minutes: number) => void;
  initialHours: number;
  initialMinutes: number;
}

const CLOCK_SIZE = 260;
const CENTER = CLOCK_SIZE / 2;

export default function AnalogClockPicker({ visible, onClose, onSelect, initialHours, initialMinutes }: Props) {
  const [hours, setHours] = useState(initialHours % 12 || 12);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [period, setPeriod] = useState(initialHours >= 12 ? 'PM' : 'AM');
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

  useEffect(() => {
    let h = initialHours % 12 || 12;
    setHours(h);
    setMinutes(initialMinutes);
    setPeriod(initialHours >= 12 ? 'PM' : 'AM');
    setMode('hours');
  }, [visible, initialHours, initialMinutes]);

  const handleDone = () => {
    const hNum = Number(hours);
    const mNum = Number(minutes);
    
    if (isNaN(hNum) || isNaN(mNum)) {
      onClose();
      return;
    }

    let finalHours = hNum % 12;
    if (period === 'PM') finalHours += 12;
    onSelect(finalHours, mNum);
    onClose();
  };

  const calculateValue = (x?: number, y?: number) => {
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) return null;

    const rx = x - CENTER;
    const ry = y - CENTER;
    let angle = Math.atan2(ry, rx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    if (mode === 'hours') {
      let h = Math.round(angle / 30) % 12;
      if (h === 0) h = 12;
      return h;
    } else {
      let m = Math.round(angle / 6) % 60;
      return m;
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const val = calculateValue(locationX, locationY);
      if (val !== null) {
        if (mode === 'hours') setHours(val);
        else setMinutes(val);
      }
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const val = calculateValue(locationX, locationY);
      if (val !== null) {
        if (mode === 'hours') setHours(val);
        else setMinutes(val);
      }
    },
    onPanResponderRelease: () => {
      if (mode === 'hours') setMode('minutes');
    },
  });

  const getHandRotation = () => {
    if (mode === 'hours') return `${(hours % 12) * 30}deg`;
    return `${minutes * 6}deg`;
  };

  const renderNumbers = () => {
    const isHours = mode === 'hours';
    return Array.from({ length: 12 }).map((_, i) => {
      const val = isHours ? (i === 0 ? 12 : i) : (i * 5);
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const r = CENTER - 35;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);

      const isActive = isHours ? (hours % 12 === i % 12) : (minutes === i * 5);

      return (
        <View 
          key={i} 
          style={[
            styles.numberContainer, 
            { left: x - 15, top: y - 15 },
            isActive && styles.activeNumberContainer
          ]}
        >
          <Text style={[styles.numberText, isActive && styles.activeNumberText]}>
            {val === 0 && !isHours ? '00' : val}
          </Text>
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.timeHeader}>
            <View style={styles.timeDisplay}>
              <TouchableOpacity onPress={() => setMode('hours')}>
                <Text style={[styles.headerTime, mode === 'hours' && styles.activeHeaderText]}>
                  {hours.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.headerSeparator}>:</Text>
              <TouchableOpacity onPress={() => setMode('minutes')}>
                <Text style={[styles.headerTime, mode === 'minutes' && styles.activeHeaderText]}>
                  {minutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.ampmContainer}>
              <TouchableOpacity onPress={() => setPeriod('AM')} style={[styles.ampmBtn, period === 'AM' && styles.activeAmpmBtn]}>
                <Text style={[styles.ampmText, period === 'AM' && styles.activeAmpmText]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPeriod('PM')} style={[styles.ampmBtn, period === 'PM' && styles.activeAmpmBtn]}>
                <Text style={[styles.ampmText, period === 'PM' && styles.activeAmpmText]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.clockBody} {...panResponder.panHandlers}>
            <View style={styles.clockFace}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {renderNumbers()}
                <View style={[styles.hand, { transform: [{ rotate: getHandRotation() }] }]}>
                  <View style={styles.handLine} />
                  <View style={styles.handKnob} />
                </View>
                <View style={styles.centerDot} />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDone} 
              style={[styles.footerBtn, styles.okBtn]}
            >
              <Text style={[styles.footerBtnText, styles.okBtnText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: Colors.surface, borderRadius: Radius.lg, width: 330, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  
  timeHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, backgroundColor: Colors.card, padding: Spacing.md, borderRadius: Radius.md },
  timeDisplay: { flexDirection: 'row', alignItems: 'center' },
  headerTime: { fontSize: 42, fontWeight: FontWeight.heavy, color: '#666' },
  activeHeaderText: { color: Colors.accent },
  headerSeparator: { fontSize: 38, color: '#444', marginHorizontal: 4 },

  ampmContainer: { gap: 4 },
  ampmBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: 'transparent' },
  activeAmpmBtn: { backgroundColor: Colors.accent + '22' },
  ampmText: { fontSize: 14, fontWeight: FontWeight.bold, color: '#666' },
  activeAmpmText: { color: Colors.accent },

  clockBody: { width: CLOCK_SIZE, height: CLOCK_SIZE, position: 'relative' },
  clockFace: { width: '100%', height: '100%', borderRadius: CLOCK_SIZE / 2, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  
  numberContainer: { position: 'absolute', width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  activeNumberContainer: { backgroundColor: Colors.accent, borderRadius: 15 },
  numberText: { color: Colors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold },
  activeNumberText: { color: '#000' },

  hand: { position: 'absolute', width: 4, height: CLOCK_SIZE, left: CENTER - 2, top: 0, justifyContent: 'flex-start', alignItems: 'center' },
  handLine: { width: 2, height: CENTER - 35, backgroundColor: Colors.accent, position: 'absolute', top: 35, borderRadius: 1 },
  handKnob: { width: 34, height: 34, backgroundColor: Colors.accent, borderRadius: 17, position: 'absolute', top: 18, justifyContent: 'center', alignItems: 'center' },
  centerDot: { width: 10, height: 10, backgroundColor: Colors.accent, borderRadius: 5, position: 'absolute', left: CENTER - 5, top: CENTER - 5, zIndex: 10 },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', gap: Spacing.md, marginTop: Spacing.lg },
  footerBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  footerBtnText: { color: Colors.textMuted, fontWeight: FontWeight.bold, fontSize: 14 },
  okBtn: {},
  okBtnText: { color: Colors.accent },
});
