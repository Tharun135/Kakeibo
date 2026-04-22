import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Animated, Pressable, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const flipAnim = React.useRef(new Animated.Value(0)).current;

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About KAKEIBO</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Pressable 
          style={styles.heroSection}
          onPress={triggerFlip}
          onHoverIn={Platform.OS === 'web' ? triggerFlip : undefined}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotateY }] }}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={80} color={Colors.accent} />
          </Animated.View>
          <Text style={styles.heroTitle}>Kakeibo</Text>
          <Text style={styles.heroSubtitle}>The Art of Mindful Spending</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What is Kakeibo?</Text>
          <Text style={styles.paragraph}>
            Pronounced <Text style={styles.italic}>"kah-keh-boh"</Text>, it is the traditional Japanese method 
             of managing household finances. The word translates literally to 
             <Text style={styles.bold}> "household financial ledger."</Text>
          </Text>
          <Text style={styles.paragraph}>
            Unlike complex digital tools that automate everything, Kakeibo is a "slow budgeting" 
            method. It’s about building a mindful relationship with your money.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Origin & History</Text>
          <View style={styles.historyRow}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>1904</Text>
            </View>
            <Text style={styles.paragraphFlat}>
              Created by <Text style={styles.bold}>Hani Motoko</Text>, Japan’s first female journalist.
            </Text>
          </View>
          <Text style={styles.paragraph}>
            She designed the system to empower homemakers to take control of their domestic 
            finances. Over 120 years later, it remains Japan’s most popular way to save.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>The 4 Pillars of Spending</Text>
          <Text style={styles.paragraph}>
            Kakeibo simplifies spending into four distinct categories to help you understand <Text style={styles.italic}>why</Text> you spend:
          </Text>
          
          <View style={styles.pillar}>
            <Text style={styles.pillarIcon}>🏠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarName}>Needs</Text>
              <Text style={styles.pillarDesc}>Essential things like rent, food, and bills.</Text>
            </View>
          </View>

          <View style={styles.pillar}>
            <Text style={styles.pillarIcon}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarName}>Wants</Text>
              <Text style={styles.pillarDesc}>Joy-bringing things like dining out or fashion.</Text>
            </View>
          </View>

          <View style={styles.pillar}>
            <Text style={styles.pillarIcon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarName}>Culture</Text>
              <Text style={styles.pillarDesc}>Self-growth like books, concerts, and learning.</Text>
            </View>
          </View>

          <View style={styles.pillar}>
            <Text style={styles.pillarIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarName}>Unexpected</Text>
              <Text style={styles.pillarDesc}>Surprise costs like repairs or medical visits.</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why Use It?</Text>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>Builds awareness of every rupee spent.</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>Reduces impulsive "one-click" purchases.</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>Aligns your spending with your life goals.</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>Promotes peace of mind through reflection.</Text>
          </View>
        </View>

        <Text style={styles.footerNote}>"Spending is the art of living intentionally."</Text>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  
  heroSection: { alignItems: 'center', marginBottom: Spacing.xxl, marginTop: Spacing.md },
  emoji: { fontSize: 60, marginBottom: Spacing.md },
  heroTitle: { fontSize: 32, fontWeight: FontWeight.heavy, color: Colors.accent },
  heroSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: { 
    fontSize: FontSize.lg, 
    fontWeight: FontWeight.bold, 
    color: Colors.textPrimary, 
    marginBottom: Spacing.md 
  },
  paragraph: { 
    fontSize: FontSize.md, 
    color: Colors.textSecondary, 
    lineHeight: 24,
    marginBottom: Spacing.md 
  },
  paragraphFlat: { 
    flex: 1,
    fontSize: FontSize.md, 
    color: Colors.textSecondary, 
    lineHeight: 24 
  },
  bold: { fontWeight: FontWeight.bold, color: Colors.textPrimary },
  italic: { fontStyle: 'italic' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  yearBadge: { 
    backgroundColor: Colors.accent + '20', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accent + '40'
  },
  yearText: { color: Colors.accent, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  pillar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md
  },
  pillarIcon: { fontSize: 24 },
  pillarName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  pillarDesc: { fontSize: FontSize.xs, color: Colors.textMuted },

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  benefitText: { fontSize: FontSize.md, color: Colors.textSecondary },

  footerNote: { 
    textAlign: 'center', 
    fontSize: FontSize.sm, 
    fontStyle: 'italic', 
    color: Colors.textMuted,
    marginTop: Spacing.md
  },
});
