import React, { useState, forwardRef, useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  NaverMapView,
  type NaverMapViewProps,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NaverMapViewProps;

const MapViewWrapper = forwardRef<NaverMapViewRef, Props>(
  ({ style, children, onInitialized, ...rest }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [key, setKey] = useState(0);
    const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      // 15초 이내에 onInitialized가 호출되지 않으면 초기화 실패로 간주
      // handleInitialized 호출 시 loadTimerRef를 직접 취소하므로 deps는 key만 필요
      const timerId = setTimeout(() => setIsError(true), 15000);
      loadTimerRef.current = timerId;
      return () => {
        clearTimeout(timerId);
        loadTimerRef.current = null;
      };
    }, [key]);

    const handleInitialized = useCallback(() => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
      setIsLoaded(true);
      setIsError(false);
      onInitialized?.();
    }, [onInitialized]);

    const handleRetry = useCallback(() => {
      setIsLoaded(false);
      setIsError(false);
      setKey((k) => k + 1);
    }, []);

    if (isError) {
      return (
        <View style={[styles.container, style, styles.errorContainer]}>
          <Text style={styles.errorText}>지도를 불러오지 못했습니다.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="지도 다시 불러오기"
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <NaverMapView
          key={key}
          ref={ref}
          style={styles.fill}
          {...rest}
          onInitialized={handleInitialized}
        >
          {children}
        </NaverMapView>
        {!isLoaded && (
          <View style={styles.loadingOverlay} pointerEvents="none" accessible={true} accessibilityLabel="지도 로딩 중">
            <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="로딩 중" />
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.gray600,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.white,
  },
});

export default MapViewWrapper;
