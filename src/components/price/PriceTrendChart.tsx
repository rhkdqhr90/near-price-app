import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';
import type { PriceResponse } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  prices: PriceResponse[];
}

interface ChartData {
  x: number;
  y: number;
  price: number;
  date: string;
  isMin: boolean;
  isMax: boolean;
}

const CHART_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const CHART_HEIGHT = 180;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 16;
const POINT_RADIUS = 5;
const LABEL_HEIGHT = 24;

const PriceTrendChart: React.FC<Props> = ({ prices }) => {
  // 등록 날짜 기준으로 정렬
  const sortedPrices = useMemo(() => {
    if (!prices || prices.length < 2) {
      return [];
    }
    return [...prices].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [prices]);

  // 최저가, 최고가 찾기
  const minPrice = useMemo(() => {
    if (sortedPrices.length === 0) return 0;
    return Math.min(...sortedPrices.map((p) => p.price));
  }, [sortedPrices]);

  const maxPrice = useMemo(() => {
    if (sortedPrices.length === 0) return 0;
    return Math.max(...sortedPrices.map((p) => p.price));
  }, [sortedPrices]);

  const priceRange = useMemo(
    () => (maxPrice - minPrice || 1), // 최저가와 최고가가 같은 경우 처리
    [minPrice, maxPrice],
  );

  // 차트용 좌표 계산
  const chartData: ChartData[] = useMemo(() => {
    if (sortedPrices.length === 0) {
      return [];
    }
    const availableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const availableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    return sortedPrices.map((price, index) => {
      const x = PADDING_LEFT + (index / Math.max(1, sortedPrices.length - 1)) * availableWidth;
      // Y축 반전 (SVG는 위에서 아래로 증가)
      const y = PADDING_TOP + availableHeight - ((price.price - minPrice) / priceRange) * availableHeight;
      const isMin = price.price === minPrice;
      const isMax = price.price === maxPrice;

      return {
        x,
        y,
        price: price.price,
        date: new Date(price.createdAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
        isMin,
        isMax,
      };
    });
  }, [sortedPrices, minPrice, maxPrice, priceRange]);

  // 2건 미만이면 렌더링하지 않음
  if (chartData.length < 2) {
    return null;
  }

  // Polyline 포인트 문자열 생성
  const polylinePoints = chartData.map((d) => `${d.x},${d.y}`).join(' ');

  // 그라데이션 아래 영역을 위한 다각형
  const polygonPoints = [
    { x: chartData[0].x, y: CHART_HEIGHT },
    ...chartData.map((d) => ({ x: d.x, y: d.y })),
    { x: chartData[chartData.length - 1].x, y: CHART_HEIGHT },
  ]
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가격 변동 추이</Text>
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Defs>
            <LinearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* 배경 그라데이션 영역 */}
          <Polygon points={polygonPoints} fill="url(#priceGradient)" />

          {/* 라인 차트 */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 데이터 포인트 */}
          {chartData.map((data, index) => {
            const isSpecial = data.isMin || data.isMax;
            return (
              <Circle
                key={index}
                cx={data.x}
                cy={data.y}
                r={isSpecial ? POINT_RADIUS : 3}
                fill={isSpecial ? colors.primary : colors.primary}
                opacity={isSpecial ? 1 : 0.8}
              />
            );
          })}
        </Svg>

        {/* X축 레이블 (첫 번째, 중간, 마지막) */}
        <View style={styles.xAxisLabels}>
          {chartData.length > 0 && (
            <Text
              style={[styles.xAxisLabel, { left: PADDING_LEFT - 20 }]}
              numberOfLines={1}
            >
              {chartData[0].date}
            </Text>
          )}
          {chartData.length > 1 && (
            <Text
              style={[
                styles.xAxisLabel,
                { left: PADDING_LEFT + (CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT) / 2 - 20 },
              ]}
              numberOfLines={1}
            >
              {chartData[Math.floor(chartData.length / 2)].date}
            </Text>
          )}
          {chartData.length > 2 && (
            <Text
              style={[
                styles.xAxisLabel,
                { right: PADDING_RIGHT - 20 },
              ]}
              numberOfLines={1}
            >
              {chartData[chartData.length - 1].date}
            </Text>
          )}
        </View>
      </View>

      {/* 최저가/최고가 범례 */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>
            최저: {Math.min(...sortedPrices.map((p) => p.price)).toLocaleString()}원
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray400 }]} />
          <Text style={styles.legendLabel}>
            최고: {Math.max(...sortedPrices.map((p) => p.price)).toLocaleString()}원
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  title: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.black,
    marginBottom: spacing.md,
  },
  chartWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: -LABEL_HEIGHT,
    left: 0,
    width: CHART_WIDTH,
    height: LABEL_HEIGHT,
  },
  xAxisLabel: {
    position: 'absolute',
    ...typography.caption,
    color: colors.gray400,
    width: 40,
    textAlign: 'center',
    fontSize: 11,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.gray700,
    fontSize: 12,
  },
});

export default PriceTrendChart;
