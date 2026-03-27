export const spacing = {
  // 기본 단위
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  // 레이아웃
  screenH: 20,   // 화면 좌우 패딩
  cardGap: 12,   // 카드 간격
  sectionGap: 24,// 섹션 간격
  headerContent: 20, // 헤더-콘텐츠 간격

  // 카드 패딩
  cardPadH: 16,  // 카드 가로 패딩
  cardPadV: 20,  // 카드 세로 패딩

  // 컴포넌트
  headerHeight: 56,
  tabBarContentHeight: 56, // insets.bottom 제외 탭바 콘텐츠 높이
  fabSize: 56,
  fabRight: 20,
  fabBottom: 16, // 탭바 상단으로부터 FAB까지의 여백

  // Toast
  toastMaxWidth: 320,
  zIndexToast: 9999,

  // 컴포넌트 내부 패딩 (디자인 시스템 기본값 14)
  inputPad: 14,
  // 카드 내 텍스트 간격 (디자인 시스템 기본값 6)
  cardTextGap: 6,

  // CameraScreen 전용
  cameraControlSize: 56,  // 갤러리 버튼 / 셔터 내부 고정 크기
  cameraShutterSize: 72,  // 셔터 버튼 고정 크기

  // OcrResultScreen 전용
  imagePreviewH: 220,     // OCR 결과 화면 이미지 미리보기 높이

  // 지도 미리보기 높이
  storeMapH: 200,           // StoreSelectScreen 지도 높이
  locationMapPreviewH: 200, // LocationSetupScreen 지도 미리보기 높이

  // 미세 간격 / 아이콘 크기
  micro: 2,               // 가장 작은 단위 간격 (카드 텍스트 라인 간격 등)
  iconSm: 16,             // 소형 인라인 아이콘/이모지 크기
  avatarInitialFont: 36,  // 아바타 이니셜 텍스트 크기
  modalMaxWidth: 320,     // 모달 최대 너비

  // Border Radius 토큰
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,

  // 추가 컴포넌트 크기
  headerIconSize: 40,
  notifDotSize: 7,
  cardImageSize: 100,
  priceImageHeight: 280,
  priceImagePlaceholderHeight: 160,
  headerLargeHeight: 56,

  // 문의 화면
  inquiryContentH: 200,

  // 드롭다운 메뉴
  dropdownMenuWidth: 240,

  // 랭크 뱃지
  rankBadgeSize: 28,

  // 테두리 두께
  borderThin: 1,
  borderMedium: 2,
  borderEmphasis: 1.5,  // 강조 테두리 (버튼 아웃라인 등)
  dividerThick: 8,      // 섹션 간 두꺼운 구분선

  // 아이콘 크기
  iconXs: 14,

  // 뒤로가기 버튼 크기
  backBtnSize: 36,
  backBtnWidth: 60,    // 헤더 뒤로가기 버튼 컨테이너 너비 (좌우 대칭용)

  // 프로필 아바타 크기
  avatarSize: 112,

  // 매장 썸네일 크기 (PriceCompareScreen 1위 카드)
  storeThumbSize: 80,

  // 그림자 오프셋 Y
  shadowOffsetY: 1,    // 기본 카드/버튼 그림자
  shadowOffsetYLg: 4,  // 드롭다운 모달 그림자

  // 그림자 반경
  shadowRadiusSm: 2,   // 기본 카드/버튼 그림자
  shadowRadiusMd: 4,   // 검색바/FAB 그림자
  shadowRadiusXl: 8,   // 검색결과 패널 그림자
  shadowRadiusLg: 12,  // 드롭다운 모달 그림자

  // 그림자 오프셋 (추가)
  shadowOffsetYMd: 2,  // 검색바/FAB 아래방향 그림자
  shadowOffsetYUp: -3, // 검색결과 패널 위방향 그림자

  // 뱃지 카드 최소 높이 (MyPageScreen 스켈레톤 높이와 동기화)
  badgeCardMinHeight: 88,

  // Digital Concierge 반경 토큰
  radiusButton: 32,    // 버튼 (2rem = 32px)
  radiusCardXl: 48,    // Product Card (3rem = 48px, "pillowy")

  // Ambient Shadow 토큰 (olive 기반 자연광)
  ambientShadowRadius: 40,
  ambientShadowOpacity: 0.04,
  ambientShadowOffsetY: 8,

  // FAB 텍스트 토큰 (MainTabNavigator FAB 플러스 아이콘)
  fabPlusFontSize: 28,
  fabPlusLineHeight: 32,
  fabOverhang: 20,       // 탭바 상단 돌출 오프셋 (marginTop: -fabOverhang)

  // 비활성화 불투명도
  disabledOpacity: 0.6,
} as const;
