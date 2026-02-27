import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import haptics from '../services/haptics';

interface ConnectionState {
  serverConnected: boolean;
  authRequired: boolean;
  usingLocalData: boolean;
  lastChecked: Date | null;
  message: string;
}

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<ConnectionState>({
    serverConnected: false,
    authRequired: false,
    usingLocalData: false,
    lastChecked: null,
    message: 'Checking connection...'
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    haptics.impactLight();
    setIsChecking(true);

    try {
      // Test basic server connection
      const connectionTest = await apiService.testConnection();

      if (!connectionTest.connected) {
        setStatus({
          serverConnected: false,
          authRequired: false,
          usingLocalData: true,
          lastChecked: new Date(),
          message: connectionTest.message,
        });
        return;
      }

      const authTest = await apiService.testAuth();
      const authRequired = !authTest.success && authTest.message.includes('Authentication required');
      const usingLocalData = apiService.isUsingLocalData();

      let message = connectionTest.message;
      if (authTest.success) {
        message = 'Connected & Authenticated';
      } else if (authRequired) {
        message = 'Connected - Auth Required (Local Data Enabled)';
      } else if (usingLocalData) {
        message = authTest.message;
      }

      setStatus({
        serverConnected: true,
        authRequired,
        usingLocalData,
        lastChecked: new Date(),
        message,
      });
    } catch (error: any) {
      setStatus({
        serverConnected: false,
        authRequired: false,
        usingLocalData: true,
        lastChecked: new Date(),
        message: `Connection failed: ${error.message}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusColor = () => {
    if (!status.serverConnected) return colors.error;
    if (status.authRequired) return colors.warning;
    return colors.success;
  };

  const getStatusIcon = () => {
    if (isChecking) return 'sync-outline';
    if (!status.serverConnected) return 'cloud-offline-outline';
    if (status.authRequired) return 'alert-circle-outline';
    return 'checkmark-circle-outline';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={checkConnection} disabled={isChecking}>
      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <View style={styles.statusHeader}>
          <Icon
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
            API Connection
          </Text>
          {status.lastChecked && (
            <Text style={styles.lastChecked}>
              {status.lastChecked.toLocaleTimeString()}
            </Text>
          )}
        </View>

        <Text style={styles.statusMessage} numberOfLines={2}>
          {status.message}
        </Text>

        {status.serverConnected && (
          <View style={styles.details}>
            <Text style={styles.detailItem}>
              Server: {status.serverConnected ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.detailItem}>
              Auth: {apiService.isAuthenticated() ? 'Authenticated' : 'Not Authenticated'}
            </Text>
            <Text style={styles.detailItem}>
              Data Mode: {status.usingLocalData ? 'Local Fallback' : 'OpenClaw API'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.refreshButton, isChecking && styles.refreshButtonDisabled]}
          onPress={checkConnection}
          disabled={isChecking}
        >
          <Text style={styles.refreshText}>
            {isChecking ? 'Checking...' : 'Tap to refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusIcon: {
    marginRight: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    flex: 1,
  },
  lastChecked: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
  },
  statusMessage: {
    fontSize: typography.subhead,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  details: {
    marginBottom: spacing.sm,
  },
  detailItem: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    marginVertical: spacing.xs / 2,
  },
  refreshButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.small,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    fontSize: typography.footnote,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default ConnectionStatus;
