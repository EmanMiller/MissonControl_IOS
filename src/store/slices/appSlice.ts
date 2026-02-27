import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  hasSeenIntro: boolean;
  hasCompletedOpenClawSetup: boolean;
  rememberMe: boolean;
}

const initialState: AppState = {
  hasSeenIntro: false,
  hasCompletedOpenClawSetup: false,
  rememberMe: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    completeIntro: state => {
      state.hasSeenIntro = true;
    },
    resetIntro: state => {
      state.hasSeenIntro = false;
    },
    completeOpenClawSetup: state => {
      state.hasCompletedOpenClawSetup = true;
    },
    resetOpenClawSetup: state => {
      state.hasCompletedOpenClawSetup = false;
    },
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },
  },
});

export const {
  completeIntro,
  resetIntro,
  completeOpenClawSetup,
  resetOpenClawSetup,
  setRememberMe,
} = appSlice.actions;

export default appSlice.reducer;
