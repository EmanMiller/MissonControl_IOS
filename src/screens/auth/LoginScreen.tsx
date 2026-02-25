import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState, AppDispatch } from '../../store';
import { devLogin } from '../../store/slices/authSlice';
import { loginWithOAuth } from '../../store/thunks/authThunks';
import type { OAuthProvider } from '../../config/oauth';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const isLoading = auth?.isLoading ?? false;
  const error = auth?.error ?? null;
  const devMode = auth?.devMode ?? true;
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);

  const handleDevLogin = () => {
    if (devMode) {
      dispatch(devLogin());
    } else {
      Alert.alert('Dev Mode', 'Development mode is not enabled');
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setPendingProvider(provider);
    try {
      await dispatch(loginWithOAuth(provider)).unwrap();
    } catch {
      // Error message is already stored in Redux state.
    } finally {
      setPendingProvider(null);
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

        <Text style={styles.sectionTitle}>Sign in with OAuth</Text>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
          disabled={isLoading}
        >
          <Text style={styles.googleButtonText}>
            {isLoading && pendingProvider === 'google'
              ? 'Connecting to Google...'
              : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.githubButton]}
          onPress={() => handleOAuthLogin('github')}
          disabled={isLoading}
        >
          <Text style={styles.githubButtonText}>
            {isLoading && pendingProvider === 'github'
              ? 'Connecting to GitHub...'
              : 'Continue with GitHub'}
          </Text>
        </TouchableOpacity>

        {devMode && (
          <>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV MODE</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.devButton]}
              onPress={handleDevLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : 'Dev Login'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Text style={styles.footerText}>
          OAuth callback: missioncontrolmobile://auth/callback
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
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  devBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    marginBottom: spacing.md,
    marginTop: spacing.md,
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
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#111827',
    fontSize: typography.headline,
    fontWeight: '600',
  },
  githubButton: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  githubButtonText: {
    color: '#F9FAFB',
    fontSize: typography.headline,
    fontWeight: '600',
  },
  devButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
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
    marginTop: spacing.lg,
  },
});

export default LoginScreen;
