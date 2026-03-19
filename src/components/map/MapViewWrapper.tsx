import React, { useState, forwardRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  NaverMapView,
  type NaverMapViewProps,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { colors } from '../../theme/colors';

type Props = NaverMapViewProps;

const MapViewWrapper = forwardRef<NaverMapViewRef, Props>(
  ({ style, children, onInitialized, ...rest }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleInitialized = () => {
      setIsLoaded(true);
      onInitialized?.();
    };

    return (
      <View style={[styles.container, style]}>
        <NaverMapView
          ref={ref}
          style={styles.fill}
          {...rest}
          onInitialized={handleInitialized}
        >
          {children}
        </NaverMapView>
        {!isLoaded && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    );
  },
);

MapViewWrapper.displayName = 'MapViewWrapper';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
});

export default MapViewWrapper;
