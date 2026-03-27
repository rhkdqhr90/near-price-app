import { colors } from './colors';

export const PJS = {
  light:     'PlusJakartaSans-Light',
  regular:   'PlusJakartaSans-Regular',
  medium:    'PlusJakartaSans-Medium',
  semiBold:  'PlusJakartaSans-SemiBold',
  bold:      'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
} as const;

export const typography = {
  headingXl: {
    fontFamily: PJS.bold,
    fontSize: 22,
    color: colors.onBackground,
    letterSpacing: -0.3,
  },
  headingLg: {
    fontFamily: PJS.bold,
    fontSize: 18,
    color: colors.onBackground,
    letterSpacing: -0.3,
  },
  headingMd: {
    fontFamily: PJS.semiBold,
    fontSize: 16,
    color: colors.onBackground,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: PJS.regular,
    fontSize: 15,
    color: colors.onBackground,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: PJS.regular,
    fontSize: 13,
    color: colors.gray600,
  },
  caption: {
    fontFamily: PJS.regular,
    fontSize: 11,
    color: colors.gray400,
  },
  captionBold: {
    fontFamily: PJS.bold,
    fontSize: 11,
    color: colors.gray400,
  },
  price: {
    fontFamily: PJS.extraBold,
    fontSize: 26,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  tabLabel: {
    fontFamily: PJS.medium,
    fontSize: 10,
    letterSpacing: -0.2,
  },
  tagText: {
    fontFamily: PJS.medium,
    fontSize: 13,
    color: colors.gray700,
  },
  // 화면 제목 (24pt) — LocationSetupScreen 등 풀스크린 타이틀용
  displaySm: {
    fontFamily: PJS.bold,
    fontSize: 24,
    color: colors.onBackground,
    letterSpacing: -0.4,
  },
  // 서브헤딩 (17pt 600) — 선택된 항목명 등 강조 텍스트용
  headingBase: {
    fontFamily: PJS.semiBold,
    fontSize: 17,
    color: colors.onBackground,
    letterSpacing: -0.2,
  },
  // 중간 본문 (15pt 400) — 레거시 fontSizes.md 대응
  bodyMd: {
    fontFamily: PJS.regular,
    fontSize: 15,
    color: colors.onBackground,
  },
  // 활동 요약 숫자 (20pt 700) — MyPage 활동 카드 수치용
  activityCount: {
    fontFamily: PJS.bold,
    fontSize: 20,
    color: colors.onBackground,
  },
  // 에러 텍스트 (13pt 500 danger)
  error: {
    fontFamily: PJS.medium,
    fontSize: 13,
    color: colors.danger,
  },
  // 비활성 텍스트 (14pt 400 gray400)
  disabled: {
    fontFamily: PJS.regular,
    fontSize: 14,
    color: colors.gray400,
  },
  // 브랜드 텍스트 (40pt 700 primary) — 로그인 화면 등 대형 타이틀용
  brand: {
    fontFamily: PJS.bold,
    fontSize: 40,
    color: colors.primary,
    letterSpacing: -0.5,
  },
} as const;
