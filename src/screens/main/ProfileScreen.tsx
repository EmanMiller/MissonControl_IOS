import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

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
      <Text style={[
        styles.menuButtonTitle, 
        dangerous && styles.dangerousText,
        disabled && styles.disabledText
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.menuButtonSubtitle}>{subtitle}</Text>
      )}
    </View>
    <Text style={[styles.chevron, disabled && styles.disabledText]}>
      {disabled ? '🚧' : '>'}
    </Text>
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user, devMode } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logout())
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          
          {devMode && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV MODE</Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <MenuButton
            title="Notifications"
            subtitle="Manage push notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in Phase 2')}
            disabled={true}
          />
          
          <MenuButton
            title="Preferences"
            subtitle="App settings and preferences"
            onPress={() => Alert.alert('Coming Soon', 'Preferences will be available in Phase 2')}
            disabled={true}
          />
          
          <MenuButton
            title="About"
            subtitle="Version and app information"
            onPress={() => Alert.alert(
              'Mission Control Mobile',
              'Version: 1.0.0-dev\nPhase 1: Foundation Setup\n\nBuilt with React Native'
            )}
          />
          
          <MenuButton
            title="Logout"
            onPress={handleLogout}
            dangerous={true}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mission Control Mobile v1.0.0-dev
          </Text>
          <Text style={styles.footerSubtext}>
            Phase 1: Foundation Setup Complete
          </Text>
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
  devBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  devBadgeText: {
    color: colors.background,
    fontSize: typography.caption1,
    fontWeight: 'bold',
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
  chevron: {
    fontSize: typography.title3,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  footerSubtext: {
    fontSize: typography.caption1,
    color: colors.textSecondary,
  },
});

export default ProfileScreen;