import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import type { OpenClawSetupStackParamList } from '../../navigation/OpenClawSetupNavigator';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { completeOpenClawSetup } from '../../store/slices/appSlice';
import type { AppDispatch } from '../../store';
import { requestNotificationPermissions } from '../../services/notificationsLocal';
import haptics from '../../services/haptics';

type ScreenRouteProp = RouteProp<OpenClawSetupStackParamList, 'Result'>;
type ScreenNavProp = StackNavigationProp<OpenClawSetupStackParamList, 'Result'>;

const OpenClawConnectionResultScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<ScreenNavProp>();

  const { success, message } = route.params;

  const handleContinue = async () => {
    haptics.success();
    Alert.alert(
      'Enable Notifications',
      'Get notified when tasks complete so you can respond quickly.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => dispatch(completeOpenClawSetup()),
        },
        {
          text: 'Allow',
          onPress: async () => {
            await requestNotificationPermissions();
            dispatch(completeOpenClawSetup());
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, success ? styles.iconSuccess : styles.iconFail]}>
          <Icon
            name={success ? 'checkmark' : 'close'}
            size={34}
            color={success ? colors.success : colors.error}
          />
        </View>

        <Text style={styles.title}>
          {success ? 'OpenClaw Connected' : 'Connection Failed'}
        </Text>
        <Text style={styles.subtitle}>{message}</Text>

        {success ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continue to Tasks</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              haptics.impactLight();
              navigation.replace('ConnectToken');
            }}
          >
            <Text style={styles.primaryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        )}
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  iconSuccess: {
    backgroundColor: `${colors.success}22`,
    borderColor: `${colors.success}66`,
  },
  iconFail: {
    backgroundColor: `${colors.error}22`,
    borderColor: `${colors.error}66`,
  },
  title: {
    color: colors.text,
    fontSize: typography.title2,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.subhead,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
});

export default OpenClawConnectionResultScreen;
