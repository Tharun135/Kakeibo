import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getConfig } from '../utils/db';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../constants/theme';

interface BiometricAuthWrapperProps {
  children: React.ReactNode;
}

export default function BiometricAuthWrapper({ children }: BiometricAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  async function checkBiometricStatus() {
    try {
      const config = await getConfig();
      if (config.biometricEnabled) {
        setIsBiometricEnabled(true);
        authenticate();
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }

  async function authenticate() {
    setIsLoading(true);
    setAuthError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for safety
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Kakeibo',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError('Authentication failed');
      }
    } catch (error) {
      setAuthError('An error occurred during authentication');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isBiometricEnabled && !isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="finger-print" size={80} color={Colors.accent} />
          </View>
          <Text style={styles.title}>KAKEIBO</Text>
          <Text style={styles.subtitle}>Unlock to manage your finances</Text>
          
          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={authenticate}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: Colors.textOnAccent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  errorText: {
    color: Colors.danger,
    marginBottom: Spacing.md,
    fontSize: FontSize.sm,
  },
});
