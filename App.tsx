import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/theme';
import type { RootState, AppDispatch } from './src/store';
import { logout } from './src/store/slices/authSlice';
import { resetOpenClawSetup } from './src/store/slices/appSlice';
import inactivityService from './src/services/inactivity';
import { setAppBadgeCount } from './src/services/notificationsLocal';
import AppErrorBoundary from './src/components/AppErrorBoundary';

const AppShell: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated ?? false);
  const pendingCount = useSelector((state: RootState) =>
    (state.tasks?.tasks ?? []).filter(task => task.status !== 'completed').length
  );

  useEffect(() => {
    setAppBadgeCount(pendingCount);
  }, [pendingCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      inactivityService.stop();
      return;
    }

    inactivityService.configure({
      timeoutMs: 15 * 60 * 1000,
      onTimeout: () => {
        dispatch(logout());
        dispatch(resetOpenClawSetup());
      },
    });

    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        inactivityService.reset();
      }
    });

    return () => {
      sub.remove();
      inactivityService.stop();
    };
  }, [dispatch, isAuthenticated]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppErrorBoundary>
        <AppNavigator />
      </AppErrorBoundary>
    </View>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider>
            <AppShell />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
