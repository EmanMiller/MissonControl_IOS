import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState, AppDispatch } from '../../store';
import {
  loginWithBiometrics,
  loginWithCredentials,
  loginWithOAuth,
} from '../../store/thunks/authThunks';
import { loginSuccess, resetTransientState } from '../../store/slices/authSlice';
import {
  completeIntro,
  completeOpenClawSetup,
  setRememberMe,
} from '../../store/slices/appSlice';
import type { OAuthProvider } from '../../config/oauth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import biometricService from '../../services/biometric';
import { apiService } from '../../services/api';
import haptics from '../../services/haptics';
import oauthService, { OAuthDebugInfo } from '../../services/oauth';

type AuthNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AuthNavigationProp>();

  const auth = useSelector((state: RootState) => state.auth);
  const appState = useSelector((state: RootState) => state.app);

  const isLoading = auth?.isLoading ?? false;
  const error = auth?.error ?? null;
  const rememberMe = appState?.rememberMe ?? true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [googleDebug, setGoogleDebug] = useState<OAuthDebugInfo | null>(null);
  const [githubDebug, setGithubDebug] = useState<OAuthDebugInfo | null>(null);
  const isOAuthLoading = isLoading && !!pendingProvider;
  const isCredentialsLoading = isLoading && !pendingProvider;

  const refreshDiagnostics = () => {
    setGoogleDebug(oauthService.getDebugInfo('google'));
    setGithubDebug(oauthService.getDebugInfo('github'));
  };

  useEffect(() => {
    dispatch(resetTransientState());

    const checkBiometricState = async () => {
      const [biometric, hasToken] = await Promise.all([
        biometricService.isAvailable(),
        apiService.hasStoredAuthToken(),
      ]);
      setBiometricAvailable(biometric.available);
      setBiometryType(biometric.biometryType ?? null);
      setHasStoredSession(hasToken);
    };

    checkBiometricState().catch(() => {
      setBiometricAvailable(false);
      setHasStoredSession(false);
    });
    refreshDiagnostics();
  }, [dispatch]);

  const biometricLabel = useMemo(() => {
    if (biometryType?.toLowerCase().includes('face')) {
      return 'Continue with Face ID';
    }
    if (biometryType?.toLowerCase().includes('touch')) {
      return 'Continue with Touch ID';
    }
    return 'Continue with Biometrics';
  }, [biometryType]);

  const persistPreference = async () => {
    await apiService.setRememberMe(rememberMe);
  };

  const handleCredentialLogin = async () => {
    haptics.impactLight();
    setPendingProvider(null);
    try {
      await dispatch(
        loginWithCredentials({
          email: email.trim().toLowerCase(),
          password,
        })
      ).unwrap();
      await persistPreference();
      haptics.success();
    } catch {
      haptics.error();
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    haptics.impactLight();
    setPendingProvider(provider);
    try {
      await dispatch(loginWithOAuth(provider)).unwrap();
      await persistPreference();
      haptics.success();
    } catch {
      haptics.error();
      refreshDiagnostics();
    } finally {
      setPendingProvider(null);
    }
  };

  const handleBiometricLogin = async () => {
    haptics.impactLight();
    setPendingProvider(null);
    try {
      await dispatch(loginWithBiometrics()).unwrap();
      haptics.success();
    } catch {
      haptics.error();
    }
  };

  const handleDemoMode = () => {
    haptics.impactLight();
    dispatch(
      loginSuccess({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@missioncontrol.local',
        provider: 'credentials',
      })
    );
    dispatch(completeIntro());
    dispatch(completeOpenClawSetup());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Icon name="sparkles-outline" size={26} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>Mission Control</Text>
              <Text style={styles.subtitle}>Run your agents with confidence</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sign in</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isCredentialsLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isCredentialsLoading}
            />

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => {
                dispatch(setRememberMe(!rememberMe));
                haptics.impactLight();
              }}
              disabled={isCredentialsLoading}
            >
              <Icon
                name={rememberMe ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={rememberMe ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.rememberText}>Remember me on this device</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleCredentialLogin}
              disabled={isCredentialsLoading || !email.trim() || !password.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {isCredentialsLoading ? 'Signing in...' : 'Sign in with Email'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.oauthButton, styles.googleButton]}
              onPress={() => handleOAuthLogin('google')}
              disabled={isLoading && pendingProvider === 'google'}
            >
              <Icon name="logo-google" size={18} color="#111827" />
              <Text style={styles.googleButtonText}>
                {isLoading && pendingProvider === 'google'
                  ? 'Connecting to Google...'
                  : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.githubButton]}
              onPress={() => handleOAuthLogin('github')}
              disabled={isLoading && pendingProvider === 'github'}
            >
              <Icon name="logo-github" size={18} color="#F9FAFB" />
              <Text style={styles.githubButtonText}>
                {isLoading && pendingProvider === 'github'
                  ? 'Connecting to GitHub...'
                  : 'Continue with GitHub'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                refreshDiagnostics();
                setShowDiagnostics(prev => !prev);
                haptics.impactLight();
              }}
            >
              <Text style={styles.debugButtonText}>
                {showDiagnostics ? 'Hide OAuth Diagnostics' : 'Show OAuth Diagnostics'}
              </Text>
            </TouchableOpacity>

            {showDiagnostics ? (
              <View style={styles.debugPanel}>
                <Text style={styles.debugPanelTitle}>Google OAuth</Text>
                <Text style={styles.debugLine}>Mode: {googleDebug?.mode ?? 'unknown'}</Text>
                <Text style={styles.debugLine}>
                  Selected: {googleDebug?.selectedStartPath ?? 'none'}
                </Text>
                <Text style={styles.debugLine}>
                  Last Error: {googleDebug?.lastError ?? 'none'}
                </Text>
                <Text style={styles.debugLine} numberOfLines={2}>
                  Last URL: {googleDebug?.lastAuthUrl ?? 'none'}
                </Text>
                <Text style={styles.debugLine}>
                  Checks:{' '}
                  {googleDebug?.checkedPaths
                    ?.map(item => `${item.path}[${item.status ?? (item.reachable ? 'ok' : 'x')}]`)
                    .join(', ') || 'none'}
                </Text>

                <Text style={[styles.debugPanelTitle, styles.debugSubTitle]}>GitHub OAuth</Text>
                <Text style={styles.debugLine}>Mode: {githubDebug?.mode ?? 'unknown'}</Text>
                <Text style={styles.debugLine}>
                  Selected: {githubDebug?.selectedStartPath ?? 'none'}
                </Text>
                <Text style={styles.debugLine}>
                  Last Error: {githubDebug?.lastError ?? 'none'}
                </Text>
              </View>
            ) : null}

            {biometricAvailable && hasStoredSession ? (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isCredentialsLoading}
              >
                <Icon
                  name={biometryType?.toLowerCase().includes('face') ? 'scan-outline' : 'finger-print-outline'}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.biometricText}>{biometricLabel}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('CreateAccount')}
              disabled={isCredentialsLoading}
            >
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoMode}
              disabled={isLoading}
            >
              <Icon name="eye-outline" size={16} color={colors.primary} />
              <Text style={styles.demoButtonText}>Continue in Demo Mode</Text>
            </TouchableOpacity>

            {isOAuthLoading ? (
              <TouchableOpacity
                style={styles.cancelOauthButton}
                onPress={() => {
                  setPendingProvider(null);
                  dispatch(resetTransientState());
                  haptics.impactLight();
                }}
              >
                <Text style={styles.cancelOauthText}>Cancel OAuth Sign In</Text>
              </TouchableOpacity>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.title2,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.footnote,
    marginTop: spacing.xs / 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rememberText: {
    color: colors.textSecondary,
    fontSize: typography.footnote,
  },
  primaryButton: {
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: typography.caption1,
  },
  oauthButton: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#111827',
    fontSize: typography.subhead,
    fontWeight: '600',
  },
  githubButton: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  githubButtonText: {
    color: '#F9FAFB',
    fontSize: typography.subhead,
    fontWeight: '600',
  },
  debugButton: {
    marginTop: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  debugButtonText: {
    color: colors.textSecondary,
    fontSize: typography.caption1,
    textDecorationLine: 'underline',
  },
  debugPanel: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.xs / 2,
  },
  debugPanelTitle: {
    color: colors.text,
    fontSize: typography.footnote,
    fontWeight: '700',
  },
  debugSubTitle: {
    marginTop: spacing.xs,
  },
  debugLine: {
    color: colors.textSecondary,
    fontSize: typography.caption2,
  },
  biometricButton: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  biometricText: {
    color: colors.primary,
    fontSize: typography.subhead,
    fontWeight: '600',
  },
  createAccountButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createAccountText: {
    color: colors.textSecondary,
    fontSize: typography.footnote,
    textDecorationLine: 'underline',
  },
  demoButton: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    backgroundColor: `${colors.primary}14`,
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: typography.footnote,
    fontWeight: '700',
  },
  cancelOauthButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelOauthText: {
    color: colors.primary,
    fontSize: typography.footnote,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.footnote,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
