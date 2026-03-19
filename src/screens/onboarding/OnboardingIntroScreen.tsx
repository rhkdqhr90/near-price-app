import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { OnboardingScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import WonIcon from '../../components/icons/WonIcon';
import CameraIcon from '../../components/icons/CameraIcon';

type OnboardingIntroScreenProps = OnboardingScreenProps<'OnboardingIntro'>;

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  Icon: React.FC<{ size?: number; color?: string }>;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: '양파 1kg,\n어디가 제일 싸?',
    subtitle: '동네 마트 가격을 한눈에 비교하고\n제일 싼 곳으로 바로 가요',
    Icon: WonIcon,
  },
  {
    id: '2',
    title: '사진 한 장이면\n가격 등록 끝',
    subtitle: '가격표를 찍으면 자동으로 인식해요\n이웃과 함께 만드는 가격 지도',
    Icon: CameraIcon,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SKIP_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const ONBOARDING_ICON_SIZE = 96;
const ONBOARDING_ICON_RADIUS = 48;

const OnboardingIntroScreen: React.FC<OnboardingIntroScreenProps> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const insets = useSafeAreaInsets();

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(index);
    },
    [],
  );

  // 건너뛰기: 슬라이드 소개만 스킵, 권한 요청은 반드시 진행
  const handleSkip = useCallback(() => {
    navigation.navigate('Permission');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      navigation.navigate('Permission');
    }
  }, [activeIndex, navigation]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Slide>) => {
    const { Icon } = item;
    return (
      <View style={styles.slide}>
        <View style={styles.iconWrapper}>
          <Icon size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    );
  }, []);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        hitSlop={SKIP_HIT_SLOP}
      >
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
        onScrollToIndexFailed={() => {}}
      />

      <View style={[styles.footer, { paddingBottom: spacing.xl + spacing.lg + insets.bottom }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {isLastSlide ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.gray600,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconWrapper: {
    width: ONBOARDING_ICON_SIZE,
    height: ONBOARDING_ICON_SIZE,
    borderRadius: ONBOARDING_ICON_RADIUS,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl + spacing.sm,
  },
  title: {
    ...typography.displaySm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg, // + insets.bottom (동적으로 추가됨)
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.gray200,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: spacing.xl,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.headingLg,
    color: colors.white,
  },
});

export default OnboardingIntroScreen;
