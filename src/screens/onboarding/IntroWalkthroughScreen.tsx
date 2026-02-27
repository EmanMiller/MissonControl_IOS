import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { completeIntro } from '../../store/slices/appSlice';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import haptics from '../../services/haptics';

const slides = [
  {
    icon: 'speedometer-outline',
    title: 'MissionControl Coordinates AI Work',
    body: 'Track tasks, monitor agent progress, and keep your team aligned from one control surface.',
  },
  {
    icon: 'radio-outline',
    title: 'Realtime Agent Visibility',
    body: 'See status changes live, receive completion notifications, and avoid blind spots in your pipeline.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Connect Securely to OpenClaw',
    body: 'After sign in, you will connect your OpenClaw token and validate access before entering the app.',
  },
] as const;

const IntroWalkthroughScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [index, setIndex] = useState(0);

  const current = useMemo(() => slides[index], [index]);
  const isLast = index === slides.length - 1;

  const handleNext = () => {
    haptics.impactLight();
    if (isLast) {
      dispatch(completeIntro());
      return;
    }

    setIndex(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name={current.icon} size={42} color={colors.primary} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        <View style={styles.paginationRow}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {!isLast ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              haptics.impactLight();
              dispatch(completeIntro());
            }}
          >
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerSpacer} />
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>{isLast ? 'Continue' : 'Next'}</Text>
          <Icon name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerSpacer: {
    width: 68,
  },
  primaryButton: {
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: typography.subhead,
    fontWeight: '600',
  },
});

export default IntroWalkthroughScreen;
