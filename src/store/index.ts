import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  createTransform,
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice from './slices/authSlice';
import taskSlice from './slices/taskSlice';
import agentSlice from './slices/agentSlice';
import appSlice from './slices/appSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  tasks: taskSlice,
  agents: agentSlice,
  app: appSlice,
});

type RootReducerState = ReturnType<typeof rootReducer>;

const resetAuthTransientTransform = createTransform<any, any, RootReducerState>(
  inbound => inbound,
  authState => {
    if (!authState) {
      return authState;
    }

    return {
      ...authState,
      isLoading: false,
      error: null,
    };
  },
  { whitelist: ['auth'] }
);

const resetTaskBadgeTransform = createTransform<any, any, RootReducerState>(
  inbound => inbound,
  tasksState => {
    if (tasksState && typeof tasksState.newCompletedCount === 'number') {
      return { ...tasksState, newCompletedCount: 0 };
    }
    return tasksState;
  },
  { whitelist: ['tasks'] }
);

const persistConfig: PersistConfig<RootReducerState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'tasks', 'agents', 'app'],
  transforms: [resetAuthTransientTransform, resetTaskBadgeTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
