import { Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({ ios: 'System', android: 'Roboto' }) ?? 'System';

export const typography = {
  headingXl: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  headingLg: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.black,
    letterSpacing: -0.3,
  },
  headingMd: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.black,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.gray900,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.gray600,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400' as const,
    color: colors.gray400,
  },
  captionBold: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.gray400,
  },
  price: {
    fontFamily,
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  tabLabel: {
    fontFamily,
    fontSize: 10,
    letterSpacing: -0.2,
  },
  tagText: {
    fontFamily,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.gray700,
  },
  // 화면 제목 (24pt) — LocationSetupScreen 등 풀스크린 타이틀용
  displaySm: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.black,
    letterSpacing: -0.4,
  },
  // 서브헤딩 (17pt 600) — 선택된 항목명 등 강조 텍스트용
  headingBase: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.black,
    letterSpacing: -0.2,
  },
  // 중간 본문 (15pt 400) — 레거시 fontSizes.md 대응
  bodyMd: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.gray900,
  },
  // 활동 요약 숫자 (20pt 700) — MyPage 활동 카드 수치용
  activityCount: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.black,
  },
  // 에러 텍스트 (13pt 500 danger)
  error: {
    fontFamily,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.danger,
  },
  // 비활성 텍스트 (14pt 400 gray400)
  disabled: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.gray400,
  },
  // 브랜드 텍스트 (40pt 700 primary) — 로그인 화면 등 대형 타이틀용
  brand: {
    fontFamily,
    fontSize: 40,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: -0.5,
  },
} as const;
