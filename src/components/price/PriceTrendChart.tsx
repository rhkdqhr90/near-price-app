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
  id: string;
  x: number;
  y: number;
  price: number;
  date: string;
  isMin: boolean;
  isMax: boolean;
}

const CHART_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const CHART_HEIGHT = 180;
const PADDING_TOP = spacing.lg;    // 16
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 40;
const PADDING_RIGHT = spacing.lg;  // 16
const POINT_RADIUS = 5;
const POINT_RADIUS_SM = 3;
const LABEL_HEIGHT = 24;
const LABEL_WIDTH = 40;

// X축 레이블 절대 위치 (모듈 상수에서 파생, StyleSheet용)
const LABEL_LEFT_FIRST = PADDING_LEFT - 20;
const LABEL_LEFT_MID =
  PADDING_LEFT + (CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT) / 2 - 20;
const LABEL_RIGHT_LAST = PADDING_RIGHT - 20;

const PriceTrendChart: React.FC<Props> = ({ prices }) => {
  // 등록 날짜 기준으로 정렬
  const sortedPrices = useMemo(() => {
    const valid = prices.filter(
      (p) => typeof p.price === 'number' && isFinite(p.price) && p.price >= 0,
    );
    if (valid.length < 2) {
      return [];
    }
    return [...valid].sort((a, b) => {
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

  // 차트용 좌표 계산
  const chartData: ChartData[] = useMemo(() => {
    if (sortedPrices.length === 0) {
      return [];
    }
    const priceRange = maxPrice - minPrice || 1; // 최저가와 최고가가 같은 경우 처리
    const availableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const availableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    return sortedPrices.map((price, index) => {
      const x = PADDING_LEFT + (index / Math.max(1, sortedPrices.length - 1)) * availableWidth;
      // Y축 반전 (SVG는 위에서 아래로 증가)
      const y = PADDING_TOP + availableHeight - ((price.price - minPrice) / priceRange) * availableHeight;
      const isMin = price.price === minPrice;
      const isMax = price.price === maxPrice;

      return {
        id: price.id,
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
  }, [sortedPrices, minPrice, maxPrice]);

  // Polyline 포인트 문자열 생성 (hooks는 early return 전에 선언)
  const polylinePoints = useMemo(
    () => chartData.map((d) => `${d.x},${d.y}`).join(' '),
    [chartData],
  );

  // 그라데이션 아래 영역을 위한 다각형
  const polygonPoints = useMemo(() => {
    if (chartData.length < 2) return '';
    return [
      { x: chartData[0].x, y: CHART_HEIGHT },
      ...chartData.map((d) => ({ x: d.x, y: d.y })),
      { x: chartData[chartData.length - 1].x, y: CHART_HEIGHT },
    ]
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
  }, [chartData]);

  // 2건 미만이면 렌더링하지 않음
  if (chartData.length < 2) {
    return null;
  }

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
          {chartData.map((data) => {
            const isSpecial = data.isMin || data.isMax;
            return (
              <Circle
                key={data.id}
                cx={data.x}
                cy={data.y}
                r={isSpecial ? POINT_RADIUS : POINT_RADIUS_SM}
                fill={colors.primary}
                opacity={isSpecial ? 1 : 0.8}
              />
            );
          })}
        </Svg>

        {/* X축 레이블 (첫 번째, 중간, 마지막) */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.xAxisLabelFirst} numberOfLines={1}>
            {chartData[0].date}
          </Text>
          {chartData.length > 1 && (
            <Text style={styles.xAxisLabelMid} numberOfLines={1}>
              {chartData[Math.floor(chartData.length / 2)].date}
            </Text>
          )}
          {chartData.length > 2 && (
            <Text style={styles.xAxisLabelLast} numberOfLines={1}>
              {chartData[chartData.length - 1].date}
            </Text>
          )}
        </View>
      </View>

      {/* 최저가/최고가 범례 */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.legendDotPrimary} />
          <Text style={styles.legendLabel}>
            최저: {minPrice.toLocaleString()}원
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotMuted} />
          <Text style={styles.legendLabel}>
            최고: {maxPrice.toLocaleString()}원
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
    shadowRadius: spacing.xs,
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
  xAxisLabelFirst: {
    position: 'absolute',
    ...typography.caption,
    color: colors.gray400,
    width: LABEL_WIDTH,
    textAlign: 'center',
    left: LABEL_LEFT_FIRST,
  },
  xAxisLabelMid: {
    position: 'absolute',
    ...typography.caption,
    color: colors.gray400,
    width: LABEL_WIDTH,
    textAlign: 'center',
    left: LABEL_LEFT_MID,
  },
  xAxisLabelLast: {
    position: 'absolute',
    ...typography.caption,
    color: colors.gray400,
    width: LABEL_WIDTH,
    textAlign: 'center',
    right: LABEL_RIGHT_LAST,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: spacing.borderThin,
    borderTopColor: colors.gray100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDotPrimary: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.primary,
  },
  legendDotMuted: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.gray400,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.gray700,
  },
});

export default PriceTrendChart;
