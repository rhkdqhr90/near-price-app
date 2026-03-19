import React, { useCallback } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BootSplash from 'react-native-bootsplash';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from './src/components/common/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App(): React.JSX.Element {
  const handleNavigationReady = useCallback(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer onReady={handleNavigationReady}>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
