import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

if (Config.SENTRY_DSN) {
  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  });
}

import React, { useCallback } from 'react';
import { StatusBar, StyleSheet, UIManager, Platform } from 'react-native';

// Android에서 LayoutAnimation 사용을 위한 필수 설정
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from './src/components/common/Toast';
import OfflineBanner from './src/components/common/OfflineBanner';


function App(): React.JSX.Element {
  const handleNavigationReady = useCallback(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <Sentry.ErrorBoundary>
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer onReady={handleNavigationReady}>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
            <OfflineBanner />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
