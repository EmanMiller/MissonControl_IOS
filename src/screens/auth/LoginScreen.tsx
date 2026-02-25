import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { devLogin } from '../../store/slices/authSlice';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const isLoading = auth?.isLoading ?? false;
  const error = auth?.error ?? null;
  const devMode = auth?.devMode ?? true;

  const handleDevLogin = () => {
    if (devMode) {
      dispatch(devLogin());
    } else {
      Alert.alert('Dev Mode', 'Development mode is not enabled');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mission Control</Text>
        <Text style={styles.subtitle}>Mobile Command Center</Text>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🚀</Text>
        </View>

        {devMode && (
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV MODE</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.devButton]}
          onPress={handleDevLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Dev Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.disabledButton]}
          disabled={true}
        >
          <Text style={styles.disabledButtonText}>
            OAuth Login (Phase 2)
          </Text>
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Text style={styles.footerText}>
          Phase 1: Foundation Setup
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.large,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.headline,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
  },
  devBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    marginBottom: spacing.lg,
  },
  devBadgeText: {
    color: colors.background,
    fontSize: typography.caption1,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  devButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  disabledButtonText: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.footnote,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.footnote,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default LoginScreen;