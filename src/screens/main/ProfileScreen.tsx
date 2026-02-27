import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { resetOpenClawSetup } from '../../store/slices/appSlice';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import haptics from '../../services/haptics';

const MenuButton: React.FC<{
  title: string;
  subtitle?: string;
  onPress: () => void;
  dangerous?: boolean;
  disabled?: boolean;
}> = ({ title, subtitle, onPress, dangerous = false, disabled = false }) => (
  <TouchableOpacity
    style={[styles.menuButton, disabled && styles.disabledButton]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.menuButtonContent}>
      <Text
        style={[
          styles.menuButtonTitle,
          dangerous && styles.dangerousText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.menuButtonSubtitle}>{subtitle}</Text> : null}
    </View>
    <Icon
      name={disabled ? 'construct-outline' : 'chevron-forward'}
      size={20}
      color={colors.textSecondary}
    />
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth?.user ?? null;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          haptics.impactLight();
          dispatch(logout());
          dispatch(resetOpenClawSetup());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        </View>

        <View style={styles.menuSection}>
          <MenuButton
            title="Notifications"
            subtitle="Manage push notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings are coming soon.')}
            disabled
          />

          <MenuButton
            title="Preferences"
            subtitle="App settings and preferences"
            onPress={() => Alert.alert('Coming Soon', 'Preferences are coming soon.')}
            disabled
          />

          <MenuButton
            title="About"
            subtitle="Version and app information"
            onPress={() =>
              Alert.alert(
                'Mission Control Mobile',
                'Version: 1.0.0\nBuilt with React Native'
              )
            }
          />

          <MenuButton title="Logout" onPress={handleLogout} dangerous />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.title1,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  userName: {
    fontSize: typography.title2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  menuSection: {
    flex: 1,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.6,
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  menuButtonSubtitle: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
  },
  dangerousText: {
    color: colors.error,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});

export default ProfileScreen;
