import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import type { AppDispatch, RootState } from '../../store';
import { createAccountWithCredentials } from '../../store/thunks/authThunks';
import { resetTransientState } from '../../store/slices/authSlice';
import { setRememberMe } from '../../store/slices/appSlice';
import { apiService } from '../../services/api';
import haptics from '../../services/haptics';

type CreateAccountNavProp = StackNavigationProp<AuthStackParamList, 'CreateAccount'>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateAccountScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<CreateAccountNavProp>();

  const isLoading = useSelector((state: RootState) => state.auth?.isLoading ?? false);
  const rememberMe = useSelector((state: RootState) => state.app?.rememberMe ?? true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    dispatch(resetTransientState());
  }, [dispatch]);

  const validate = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return 'Please fill in all fields.';
    }

    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleCreateAccount = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Create Account', validationError);
      haptics.error();
      return;
    }

    haptics.impactLight();

    try {
      await dispatch(
        createAccountWithCredentials({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        })
      ).unwrap();
      await apiService.setRememberMe(rememberMe);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Create Account', error?.message ?? 'Unable to create account right now.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Set up your account to get started.</Text>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => {
              dispatch(setRememberMe(!rememberMe));
              haptics.impactLight();
            }}
            disabled={isLoading}
          >
            <Icon
              name={rememberMe ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={rememberMe ? colors.primary : colors.textSecondary}
            />
            <Text style={styles.rememberText}>Remember me on this device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
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
  header: {
    height: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.subhead,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    marginBottom: spacing.md,
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
  submitButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
});

export default CreateAccountScreen;
