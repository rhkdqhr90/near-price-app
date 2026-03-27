export const colors = {
  primary: '#324e24',          // Deep Olive
  primaryLight: '#e8f5e0',     // Olive 연한 tint
  primaryDark: '#496639',      // Primary Container
  primaryContainer: '#496639', // Primary Container (semantic alias)
  onPrimary: '#ffffff',        // On Primary

  secondaryBg: '#f5f3ee',      // surface-container-low

  // Surface 계층 (No-Line Rule 구현 — 테두리 대신 배경색 계층으로 구분)
  surface: '#fbf9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainer: '#f0eee9',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',
  onBackground: '#1b1c19',

  // Accent: mustard yellow
  accent: '#E8BC50',
  accentLight: '#FFF9E6',
  accentSurface: '#FAFAF8',

  // Tertiary: Soft Mustard Gold (억양 색상)
  tertiary: '#5b4300',
  tertiaryContainer: '#795900',
  onTertiaryContainer: '#ffd274',
  tertiaryFixedDim: '#f6be39',

  // Olive green
  olive: '#5E8035',
  oliveLight: '#EFF5E7',
  oliveDark: '#3D5A20',

  // Teal
  midnightMint: '#3D7268',
  midnightMintLight: '#E5F0EE',
  midnightMintDark: '#2A5550',

  black: '#1b1c19',
  gray900: '#2d2e2b',
  gray700: '#555555',
  gray600: '#717171',
  gray400: '#AEAEB2',
  gray200: '#e4e2dd',
  gray100: '#f0eee9',
  white: '#FFFFFF',

  cardBg: '#FFFFFF',
  surfaceBg: '#fbf9f4',

  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FFC107',
  warningLight: '#FFF8E1',

  danger: '#E53935',
  dangerLight: '#FFEBEE',

  adBg: '#fdf6e0',
  adText: '#5b4300',

  tabBorder: '#F0F0F0',
  tabIconActive: '#324e24',
  tabIconInactive: '#8c9e84',  // warm muted sage (olive 팔레트 기반 desaturated)

  // Outline ("Ghost Border" — 접근성용 최소 경계선)
  outlineVariant: '#c3c8bb',

  // Ambient Shadow (olive 기반 자연광 그림자)
  ambientShadow: 'rgba(50, 78, 36, 0.04)',

  // Card decoration
  cardDivider: '#F5F5F5',
  cardPriceStrike: '#CCCCCC',

  // FAB
  fabRipple: 'rgba(255,255,255,0.25)',

  // Camera
  cameraOverlayDark: 'rgba(0,0,0,0.5)',
  cameraShutterBg: 'rgba(255,255,255,0.2)',

  // Modal / Overlay
  modalOverlay: 'rgba(0,0,0,0.4)',
  dropdownOverlay: 'rgba(0,0,0,0.3)',

  // 배너 / 모달 오버레이
  bannerOverlay: 'rgba(0,0,0,0.35)',
  bannerTextMuted: 'rgba(255,255,255,0.85)',
  modalOverlayDark: 'rgba(0,0,0,0.5)',

  // 카드 이미지 오버레이
  featuredImageOverlay: 'rgba(0,0,0,0.18)',
  heartBtnBg: 'rgba(0,0,0,0.28)',
  distanceBadgeBg: 'rgba(0,0,0,0.42)',
  flyerSubtitleText: 'rgba(255,255,255,0.88)',
  flyerCircleOverlay: 'rgba(255,255,255,0.12)',
  flyerCircleOverlayFaint: 'rgba(255,255,255,0.08)',
  // 전단지 상세 헤더 glassmorphism
  flyerDetailHeaderBg: 'rgba(255,253,248,0.95)',
  flyerHeroDateLine: 'rgba(255,255,255,0.40)',
  flyerHeroDateText: 'rgba(255,255,255,0.97)',

  // 그림자
  shadowBase: '#000000',

  // Kakao
  kakaoYellow: '#FEE500',

  // 전단지 전용
  flyerRed: '#e60012',
  flyerHeroRed: '#dc2626',
  flyerBadgeYellow: '#FFD700',
  flyerBadgeBlue: '#2563eb',
  flyerProductDark: '#1a1a1a',
  starYellow: '#F59E0B',
} as const;
