import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type { OpenClawSetupStackParamList } from '../../navigation/OpenClawSetupNavigator';
import { colors, spacing, typography } from '../../styles/theme';
import { apiService } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

type ScreenRouteProp = RouteProp<OpenClawSetupStackParamList, 'Validating'>;
type ScreenNavProp = StackNavigationProp<OpenClawSetupStackParamList, 'Validating'>;

const OpenClawValidatingScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<ScreenNavProp>();

  useEffect(() => {
    const runValidation = async () => {
      const token = route.params.token;
      let success = false;
      let message = 'Unable to validate token.';

      try {
        await apiService.setAuthToken(token);
        const connection = await apiService.testConnection();
        if (!connection.connected) {
          message = connection.message;
        } else {
          const auth = await apiService.testAuth();
          success = auth.success;
          message = auth.message;
        }
      } catch (error: any) {
        message = error?.message ?? message;
      }

      if (!success) {
        await apiService.setAuthToken(null);
      }

      navigation.replace('Result', {
        success,
        message,
        token,
      });
    };

    runValidation().catch(() => {
      navigation.replace('Result', {
        success: false,
        message: 'Unable to validate token.',
        token: route.params.token,
      });
    });
  }, [navigation, route.params.token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name="shield-checkmark-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Validating your OpenClaw token...</Text>
        <Text style={styles.subtitle}>This usually takes a few seconds.</Text>
        <LoadingSkeleton lines={3} style={styles.skeleton} />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.subhead,
    textAlign: 'center',
  },
  skeleton: {
    width: '100%',
    marginTop: spacing.lg,
  },
});

export default OpenClawValidatingScreen;
