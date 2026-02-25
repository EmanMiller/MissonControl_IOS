import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.message} numberOfLines={2}>
      {message}
    </Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: borderRadius.small,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: typography.subhead,
    color: colors.text,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  retryText: {
    fontSize: typography.footnote,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default ErrorBanner;
