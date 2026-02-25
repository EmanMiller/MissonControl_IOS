import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchTasks, markCompletedTasksSeen } from '../../store/slices/taskSlice';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Task } from '../../store/slices/taskSlice';
import ConnectionStatus from '../../components/ConnectionStatus';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prevStatus = useRef(status);

  React.useEffect(() => {
    if (prevStatus.current !== status) {
      prevStatus.current = status;
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status, scale]);

  const getStatusColor = (s: Task['status']) => {
    switch (s) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.primary;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor(status), transform: [{ scale }] },
      ]}
    >
      <Text style={styles.statusText}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </Animated.View>
  );
};

const TasksScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { tasks, isLoading, error } = useSelector((state: RootState) => state.tasks);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(markCompletedTasksSeen());
    }, [dispatch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTasks());
    setRefreshing(false);
  }, [dispatch]);

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.taskCard} activeOpacity={0.85}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      {item.description ? (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.taskFooter}>
        <Text style={styles.taskDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.assignedAgent ? (
          <Text style={styles.agentText}>Agent: {item.assignedAgent}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const showLoading = isLoading && tasks.length === 0 && !error;
  const showEmpty = !isLoading && tasks.length === 0 && !error;
  const showList = tasks.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.getParent()?.navigate('CreateTask' as never)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ConnectionStatus />
        {error ? (
          <ErrorBanner message={error} onRetry={() => dispatch(fetchTasks())} />
        ) : null}
        {showLoading ? (
          <LoadingSkeleton lines={5} style={styles.skeleton} />
        ) : showEmpty ? (
          <EmptyState
            emoji="📋"
            title="No tasks yet"
            subtitle="Tap the + button to create your first task and assign it to an agent."
          />
        ) : showList ? (
          <View style={styles.tasksList}>
            {tasks.map((item) => renderTask({ item }))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  skeleton: {
    marginTop: spacing.sm,
  },
  tasksList: {
    padding: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.small,
  },
  statusText: {
    fontSize: typography.caption2,
    fontWeight: 'bold',
    color: colors.text,
  },
  taskDescription: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
  },
  agentText: {
    fontSize: typography.footnote,
    color: colors.primary,
  },
});

export default TasksScreen;
