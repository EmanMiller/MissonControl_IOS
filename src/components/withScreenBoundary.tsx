import React from 'react';
import AppErrorBoundary from './AppErrorBoundary';

export const withScreenBoundary = <P extends object>(
  ScreenComponent: React.ComponentType<P>
) => {
  const WrappedScreen: React.FC<P> = props => (
    <AppErrorBoundary>
      <ScreenComponent {...props} />
    </AppErrorBoundary>
  );

  const baseName = ScreenComponent.displayName || ScreenComponent.name || 'Screen';
  WrappedScreen.displayName = `WithScreenBoundary(${baseName})`;
  return WrappedScreen;
};

export default withScreenBoundary;
