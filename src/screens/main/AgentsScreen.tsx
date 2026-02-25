import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchAgents } from '../../store/thunks/agentThunks';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Agent } from '../../store/slices/agentSlice';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { SafeAreaView } from 'react-native-safe-area-context';

const AgentsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const agentsState = useSelector((state: RootState) => state.agents);
  const agents = agentsState?.agents ?? [];
  const isLoading = agentsState?.isLoading ?? false;
  const error = agentsState?.error ?? null;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAgents());
    setRefreshing(false);
  }, [dispatch]);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return colors.success;
      case 'busy': return colors.warning;
      case 'idle': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getAgentEmoji = (type: Agent['type']) => {
    switch (type) {
      case 'assistant': return '🤖';
      case 'specialist': return '🔧';
      case 'manager': return '👔';
      default: return '🤖';
    }
  };

  const renderAgent = ({ item }: { item: Agent }) => (
    <TouchableOpacity style={styles.agentCard} activeOpacity={0.85}>
      <View style={styles.agentHeader}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentEmoji}>{getAgentEmoji(item.type)}</Text>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{item.name}</Text>
            <Text style={styles.agentType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      {item.currentTask ? (
        <View style={styles.currentTask}>
          <Text style={styles.currentTaskLabel}>Current Task:</Text>
          <Text style={styles.currentTaskText}>{item.currentTask}</Text>
        </View>
      ) : null}
      <View style={styles.performanceSection}>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceValue}>{item.performance.tasksCompleted}</Text>
          <Text style={styles.performanceLabel}>Completed</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceValue}>{item.performance.averageTime}m</Text>
          <Text style={styles.performanceLabel}>Avg Time</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceValue}>{item.performance.successRate}%</Text>
          <Text style={styles.performanceLabel}>Success</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const showLoading = isLoading && agents.length === 0 && !error;
  const showEmpty = !isLoading && agents.length === 0 && !error;
  const showList = agents.length > 0;

  if (showLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agents</Text>
        </View>
        <LoadingSkeleton lines={6} style={styles.skeleton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
      </View>
      {error ? (
        <ErrorBanner message={error} onRetry={() => dispatch(fetchAgents())} />
      ) : null}
      {showEmpty ? (
        <EmptyState
          emoji="🤖"
          title="No agents available"
          subtitle="Agents will appear here once they're connected to your OpenClaw instance."
        />
      ) : showList ? (
        <FlatList
          data={agents}
          renderItem={renderAgent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.agentsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : null}
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
  skeleton: {
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  agentsList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  agentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  agentType: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
  },
  statusIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.small,
  },
  statusText: {
    fontSize: typography.caption2,
    fontWeight: 'bold',
    color: colors.text,
  },
  currentTask: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  currentTaskLabel: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  currentTaskText: {
    fontSize: typography.subhead,
    color: colors.text,
  },
  performanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: typography.title3,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  performanceLabel: {
    fontSize: typography.caption1,
    color: colors.textSecondary,
  },
});

export default AgentsScreen;
