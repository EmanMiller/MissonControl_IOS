import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { markCompletedTasksSeen } from '../../store/slices/taskSlice';
import { fetchTasks, updateTaskById, deleteTaskById } from '../../store/thunks/taskThunks';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Task } from '../../store/slices/taskSlice';
import ConnectionStatus from '../../components/ConnectionStatus';
import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiService } from '../../services/api';
import { showTaskCompletedNotification } from '../../services/notificationsLocal';
import haptics from '../../services/haptics';

type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed';
const EMPTY_TASKS: Task[] = [];

const filters: Array<{ key: TaskFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

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
      default: return colors.warning;
    }
  };

  const getStatusText = (s: Task['status']) => {
    if (s === 'in_progress') return 'IN PROGRESS';
    return s.toUpperCase();
  };

  return (
    <Animated.View
      style={[
        styles.statusBadge,
        { backgroundColor: `${getStatusColor(status)}22`, borderColor: `${getStatusColor(status)}66`, transform: [{ scale }] },
      ]}
    >
      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{getStatusText(status)}</Text>
    </Animated.View>
  );
};

const TasksScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const tasksState = useSelector((state: RootState) => state.tasks);
  const tasks = tasksState?.tasks ?? EMPTY_TASKS;
  const isLoading = tasksState?.isLoading ?? false;
  const error = tasksState?.error ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [isOffline, setIsOffline] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState('Checking...');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(markCompletedTasksSeen());
    }, [dispatch])
  );

  const refreshConnection = useCallback(async () => {
    const result = await apiService.testConnection();
    const offline = !result.connected || apiService.isUsingLocalData();
    setIsOffline(offline);
    setConnectionLabel(result.connected ? (offline ? 'Offline Cache' : 'Connected') : 'Disconnected');
  }, []);

  useEffect(() => {
    refreshConnection().catch(() => {
      setIsOffline(true);
      setConnectionLabel('Disconnected');
    });

    const timer = setInterval(() => {
      refreshConnection().catch(() => {
        setIsOffline(true);
        setConnectionLabel('Disconnected');
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshConnection]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTasks());
    await refreshConnection();
    setRefreshing(false);
  }, [dispatch, refreshConnection]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.status === activeFilter);
  }, [activeFilter, tasks]);

  const handleQuickComplete = async (task: Task) => {
    haptics.success();
    const result = await dispatch(
      updateTaskById({
        id: task.id,
        updates: {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        },
      })
    );

    if (updateTaskById.fulfilled.match(result) && result.payload?.status === 'completed') {
      showTaskCompletedNotification(result.payload.title);
    }
  };

  const handleDelete = async (taskId: string) => {
    haptics.error();
    await dispatch(deleteTaskById(taskId));
  };

  const renderRightActions = (item: Task) => (
    <View style={styles.swipeActionsWrap}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.completeAction]}
        onPress={() => handleQuickComplete(item)}
      >
        <Icon name="checkmark" size={18} color={colors.text} />
        <Text style={styles.swipeActionText}>Done</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={() => handleDelete(item.id)}
      >
        <Icon name="trash-outline" size={18} color={colors.text} />
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
      <TouchableOpacity style={styles.taskCard} activeOpacity={0.9}>
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
            <Text style={styles.agentText}>{item.assignedAgent}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const showLoading = isLoading && tasks.length === 0 && !error;
  const showEmpty = !isLoading && filteredTasks.length === 0 && !error;
  const showList = filteredTasks.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tasks</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.connectionDot, { backgroundColor: isOffline ? colors.warning : colors.success }]} />
            <Text style={styles.connectionText}>{connectionLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            haptics.impactLight();
            navigation.getParent()?.navigate('CreateTask' as never);
          }}
        >
          <Icon name="add" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.offlineBannerText}>You are viewing cached data while offline.</Text>
        </View>
      ) : null}

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

        <View style={styles.filterRow}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterPill, activeFilter === filter.key && styles.filterPillActive]}
              onPress={() => {
                haptics.impactLight();
                setActiveFilter(filter.key);
              }}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <ErrorBanner message={error} onRetry={() => dispatch(fetchTasks())} />
        ) : null}

        {showLoading ? (
          <LoadingSkeleton lines={5} style={styles.skeleton} />
        ) : showEmpty ? (
          <EmptyState
            emoji="📋"
            title="No tasks for this filter"
            subtitle="Pull to refresh or create a task to get started."
          />
        ) : showList ? (
          <View style={styles.tasksList}>
            {filteredTasks.map((item) => renderTask({ item }))}
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
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: colors.textSecondary,
    fontSize: typography.caption1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.warning}20`,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.warning}40`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offlineBannerText: {
    color: colors.warning,
    fontSize: typography.footnote,
    fontWeight: '600',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: `${colors.primary}66`,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: typography.footnote,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
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
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
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
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.caption2,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  swipeActionsWrap: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  swipeAction: {
    width: 84,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    marginLeft: spacing.xs,
    gap: spacing.xs,
  },
  completeAction: {
    backgroundColor: colors.success,
  },
  deleteAction: {
    backgroundColor: colors.error,
  },
  swipeActionText: {
    color: colors.text,
    fontSize: typography.caption1,
    fontWeight: '700',
  },
});

export default TasksScreen;
