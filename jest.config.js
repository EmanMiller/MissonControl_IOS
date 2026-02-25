module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  fakeTimers: {enableGlobally: true},
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@reduxjs/toolkit|immer|redux|redux-persist|redux-thunk|reselect|@react-native-async-storage/async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-vector-icons)/)',
  ],
};
