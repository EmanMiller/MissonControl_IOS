import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../styles/theme';

interface LoadingSkeletonProps {
  lines?: number;
  style?: object;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ lines = 4, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const animatedLineStyle = { opacity };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.line,
            i === lines - 1 && lines > 2 && styles.shortLine,
            animatedLineStyle,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  line: {
    width: '100%',
    height: 16,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.small,
    marginBottom: spacing.sm,
  },
  shortLine: {
    width: '60%',
  },
});

export default LoadingSkeleton;
