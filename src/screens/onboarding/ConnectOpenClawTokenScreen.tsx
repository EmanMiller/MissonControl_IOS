import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type { OpenClawSetupStackParamList } from '../../navigation/OpenClawSetupNavigator';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import haptics from '../../services/haptics';

type NavigationProp = StackNavigationProp<OpenClawSetupStackParamList, 'ConnectToken'>;

const ConnectOpenClawTokenScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [token, setToken] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name="key-outline" size={36} color={colors.primary} />
        </View>

        <Text style={styles.title}>Connect your OpenClaw Instance</Text>
        <Text style={styles.description}>
          Paste your OpenClaw auth token below. You can find it in OpenClaw settings under API Access.
        </Text>

        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="oc_..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, token.trim().length === 0 && styles.buttonDisabled]}
          onPress={() => {
            if (!token.trim()) return;
            haptics.impactLight();
            navigation.navigate('Validating', { token: token.trim() });
          }}
          disabled={token.trim().length === 0}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
          <Icon name="arrow-forward" size={18} color={colors.text} />
        </TouchableOpacity>
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
    padding: spacing.lg,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.title2,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.subhead,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 92,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
});

export default ConnectOpenClawTokenScreen;
