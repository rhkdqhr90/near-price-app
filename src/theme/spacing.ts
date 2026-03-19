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
  cardGap: 10,   // 카드 간격
  sectionGap: 24,// 섹션 간격
  headerContent: 20, // 헤더-콘텐츠 간격

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
} as const;
