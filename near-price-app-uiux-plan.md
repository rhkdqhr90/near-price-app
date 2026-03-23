# Near-Price-App UI/UX 프로덕션 레벨 개선 기획서

> 작성일: 2026-03-19
> 대상 프로젝트: near-price-app (React Native)
> 현재 버전: 0.0.1
> 분석 범위: 21개 화면, 20+ 컴포넌트, 테마 시스템, 네비게이션 전체

---

## 1. 현재 UI/UX 수준 진단

### 1.1 잘 되어 있는 부분

프로젝트의 기초 설계는 탄탄한 편이다. 테마 시스템(`colors.ts`, `typography.ts`, `spacing.ts`)이 잘 정의되어 있고, 대부분의 화면에서 일관되게 사용하고 있다. 네비게이션 구조도 Onboarding → Auth → Main 흐름이 명확하고, TypeScript 타입 안전성도 높다. Zustand 기반 상태 관리, React Query 기반 서버 상태 관리 패턴도 적절하다. `LoadingView`, `ErrorView`, `EmptyState` 같은 공통 상태 컴포넌트가 이미 존재한다.

### 1.2 프로덕션 대비 부족한 점 (요약)

| 영역 | 현재 수준 | 프로덕션 기대 수준 | 갭 |
|------|-----------|-------------------|-----|
| 접근성(a11y) | 거의 없음 | WCAG 2.1 AA 준수 | 큼 |
| 애니메이션/전환 | 거의 없음 | 자연스러운 마이크로인터랙션 | 큼 |
| 에러/빈 상태 UX | 기본 수준 | 맥락별 안내 + 복구 액션 | 중간 |
| 폼 UX | Alert 기반 검증 | 인라인 검증 + 실시간 피드백 | 큼 |
| 스켈레톤/로딩 | 있으나 하드코딩 | 실제 레이아웃 매칭 + shimmer | 중간 |
| 디자인 토큰 일관성 | 90% 적용 | 100% + lint 강제 | 작음 |
| 토스트/알림 | 단일 토스트 | 큐 기반 + 다양한 타입 | 중간 |
| i18n | 전혀 없음 (한국어 하드코딩) | 추출 가능한 구조 | 큼 (단, 단일 언어라면 P2) |

---

## 2. 화면별 구체적 개선 사항

### 2.1 온보딩 (`src/screens/onboarding/`)

#### OnboardingIntroScreen.tsx

**P0 — 즉시 수정**
- (없음)

**P1 — 중요**
- **슬라이드 제목에 `\n` 하드코딩 제거**: 화면 크기에 따라 줄바꿈이 깨질 수 있다. `flexWrap`과 `textAlign: 'center'`로 자연스러운 줄바꿈 처리.
  - 파일: `OnboardingIntroScreen.tsx` SLIDES 배열
  - 작업량: 30분 / 쉬움
- **페이지네이션 닷 애니메이션 추가**: 현재 width만 변경. `Animated.spring`으로 스무스한 전환 적용.
  - 파일: `OnboardingIntroScreen.tsx` 스타일의 `dot` / `activeDot`
  - 작업량: 1시간 / 보통

**P2 — 나이스투해브**
- ICON_SIZE(96), ICON_RADIUS(48) → `spacing` 토큰으로 이동
- 슬라이드를 3~4개로 확장하여 앱의 핵심 가치를 더 전달

#### PermissionScreen.tsx

**P1 — 중요**
- **권한별 개별 그랜트 상태 표시**: 현재 일괄 요청 후 결과만 확인. 각 권한 아이템 옆에 체크 아이콘으로 승인 여부 표시.
  - 파일: `PermissionScreen.tsx` PERMISSIONS 배열 및 렌더링 로직
  - 작업량: 2시간 / 보통

---

### 2.2 인증 (`src/screens/auth/`)

#### LoginScreen.tsx

**P0 — 즉시 수정**
- **앱 이름 폰트 사이즈 하드코딩 수정**: `fontSize: 40` → `typography.displaySm` 또는 새로운 `typography.brand` 토큰 생성.
  - 파일: `LoginScreen.tsx` 스타일 `appName`
  - 작업량: 15분 / 쉬움

**P1 — 중요**
- **로그인 버튼 프레스 피드백 강화**: 현재 `activeOpacity`만 적용. `Animated.spring` 스케일 효과 추가.
  - 작업량: 1시간 / 보통
- **로딩 중 전체 화면 딤 처리**: 로그인 진행 중 배경 딤 + 센터 스피너로 사용자 인지 강화.
  - 작업량: 1시간 / 보통

#### LocationSetupScreen.tsx

**P0 — 즉시 수정**
- **Alert 기반 에러 → 인라인 에러 메시지 전환**: GPS 실패, 검색 실패 시 화면 내에 에러 배너 표시. `Alert.alert()`는 사용자 흐름을 끊는다.
  - 파일: `LocationSetupScreen.tsx` GPS 에러/검색 에러 핸들링
  - 작업량: 2시간 / 보통

**P1 — 중요**
- **GPS 이모지 "📍" → MapPinIcon 컴포넌트로 교체**: 이모지는 플랫폼마다 렌더링이 다르다.
  - 파일: `LocationSetupScreen.tsx` GPS 버튼 영역
  - 작업량: 15분 / 쉬움
- **지도 줌 레벨 상수화**: `10`, `14`, `18` 하드코딩 → `constants.ts`에 `MAP_ZOOM` 객체 추가.
  - 작업량: 15분 / 쉬움

---

### 2.3 홈 (`src/screens/home/`)

#### HomeScreen.tsx

**P0 — 즉시 수정**
- **알림 아이콘 미구현 처리**: `TODO` 주석이 남아 있고 `View`로 감싸져 있음. `TouchableOpacity`로 감싸고, 미구현 시 "준비 중" 토스트 또는 비활성 상태 표시.
  - 파일: `HomeScreen.tsx` 헤더 영역 BellIcon 부분
  - 작업량: 30분 / 쉬움
- **광고 배너 이모지 "🏪" → 아이콘 컴포넌트 교체**:
  - 파일: `HomeScreen.tsx` AD_BANNER 렌더링 부분
  - 작업량: 30분 / 쉬움

**P1 — 중요**
- **알림 도트 포지셔닝 하드코딩 수정**: `top: 0, right: 0, width: 7, height: 7` → spacing 토큰 기반.
  - 파일: `HomeScreen.tsx` 스타일의 `notificationDot`
  - 작업량: 15분 / 쉬움
- **가격 카드 프레스 피드백 통일**: iOS는 opacity, Android는 ripple을 이미 사용 중이지만, 플랫폼별 분기가 명시적이지 않음. `Pressable` 컴포넌트로 통일하고 `android_ripple` + `style` 프레스드 상태 함수 적용.
  - 작업량: 2시간 / 보통
- **FAB 접근성 레이블 추가**: `accessibilityLabel="가격 등록"`, `accessibilityRole="button"`.
  - 파일: `HomeScreen.tsx` FAB 컴포넌트
  - 작업량: 15분 / 쉬움

**P2 — 나이스투해브**
- 가격 카드 진입 애니메이션 (FlatList 아이템별 stagger 페이드인)
- 인기 태그 자동 슬라이드 또는 무한 스크롤

#### SearchScreen.tsx

**P0 — 즉시 수정**
- **클리어 버튼 유니코드 "✕" → CloseIcon 컴포넌트 교체**: 플랫폼마다 렌더링이 다르고 접근성 부족.
  - 파일: `SearchScreen.tsx` 검색바 클리어 버튼
  - 작업량: 30분 / 쉬움

**P1 — 중요**
- **검색바 borderRadius 하드코딩 → spacing 토큰**: `borderRadius: 10` → `spacing.radiusMd` (신규 토큰).
  - 파일: `SearchScreen.tsx` 스타일의 `searchBarInner`
  - 작업량: 15분 / 쉬움
- **검색 결과 빈 상태 일러스트레이션 추가**: 현재 텍스트만 표시. `EmptyState` 컴포넌트에 검색 관련 아이콘 전달.
  - 작업량: 1시간 / 보통
- **디바운스 cleanup 개선**: `useEffect` 내에서 `clearTimeout` 정리가 있지만, 커스텀 `useDebounce` 훅으로 추출하면 재사용 가능.
  - 작업량: 1시간 / 보통

---

### 2.4 가격 등록 플로우 (`src/screens/price/`)

#### StoreSelectScreen.tsx

**P0 — 즉시 수정**
- **등록 폼 필드별 유효성 검증 UI 추가**: 현재 검증 없이 submit. 이름 빈칸, 주소 빈칸 시 필드 테두리 빨간색 + 인라인 에러 메시지.
  - 파일: `StoreSelectScreen.tsx` RegisterForm 렌더링 부분
  - 작업량: 3시간 / 보통

**P1 — 중요**
- **바텀시트 SNAP_POINTS 상수 외부화**: `['28%', '60%', '92%']` → `constants.ts`에 이동.
  - 작업량: 15분 / 쉬움
- **검색 결과 로딩 인디케이터**: 현재 검색 중 상태가 불명확. 리스트 상단에 작은 스피너 추가.
  - 작업량: 1시간 / 보통
- **감지 모드 UX 강화**: GPS 자동 감지 후 "이 매장이 맞나요?" 확인 UX를 더 명확하게. 현재 카드 하나만 표시되어 사용자가 무엇을 해야 하는지 불분명할 수 있다.
  - 작업량: 2시간 / 보통

#### InputMethodScreen.tsx

**P1 — 중요**
- **카드 패딩 하드코딩 수정**: `padding: 24` → `spacing.xxl` (=24) 이미 존재하므로 교체.
  - 파일: `InputMethodScreen.tsx` 스타일의 `card`
  - 작업량: 15분 / 쉬움
- **아이콘 래퍼 크기 하드코딩 수정**: `60x60` → `spacing` 토큰 추가 또는 기존 것 활용.
  - 작업량: 15분 / 쉬움

#### CameraScreen.tsx

**P1 — 중요**
- **카메라 가이드 오버레이 추가**: 가격표 영역을 안내하는 사각 가이드 프레임. 사용자가 어디에 가격표를 맞춰야 하는지 시각적 힌트.
  - 파일: `CameraScreen.tsx` 카메라 뷰 위 오버레이
  - 작업량: 3시간 / 보통
- **갤러리 버튼 텍스트 → 아이콘 + 텍스트**: "갤러리" 텍스트만 있으면 탭 영역이 불명확. 갤러리 아이콘 추가.
  - 작업량: 1시간 / 보통

**P2 — 나이스투해브**
- 촬영 시 셔터 애니메이션 (화면 깜빡임 효과)
- 촬영 후 프리뷰 확인 단계 추가

#### OcrResultScreen.tsx

**P1 — 중요**
- **OCR 결과 카드 선택 피드백**: 현재 `TouchableOpacity`만 사용. 선택 시 체크 아이콘 또는 배경색 변경으로 "이 항목을 선택했다"는 피드백 강화.
  - 파일: `OcrResultScreen.tsx` OCR 아이템 렌더링
  - 작업량: 1.5시간 / 보통
- **OCR 파싱 로직 분리**: `parseOcrText` 함수가 컴포넌트 내부에 있음. `utils/ocrParser.ts`로 추출.
  - 작업량: 1시간 / 쉬움
- **최대 결과 수(6개) 하드코딩 → 상수화**: `.slice(0, 6)` → `OCR_MAX_RESULTS` 상수.
  - 작업량: 15분 / 쉬움

#### ItemDetailScreen.tsx

**P0 — 즉시 수정**
- **Alert 기반 폼 검증 → 인라인 검증으로 전환**: `Alert.alert()`로 "상품명을 입력해주세요" 등 표시하는 방식은 프로덕션 앱에서 사용하면 안 됨. 각 필드 아래에 빨간 텍스트로 에러 메시지 표시.
  - 파일: `ItemDetailScreen.tsx` `handleSubmit` 함수 및 각 필드 렌더링
  - 작업량: 4시간 / 보통~어려움
- **이벤트 날짜 입력에 DatePicker 적용**: 현재 `TextInput`에 `YYYY-MM-DD` 직접 입력. `@react-native-community/datetimepicker` 적용.
  - 파일: `ItemDetailScreen.tsx` 이벤트 시작/종료일 필드
  - 작업량: 3시간 / 보통

**P1 — 중요**
- **상품명 서제스천 드롭다운 UX 개선**: 현재 blur 200ms 딜레이로 사라짐. 터치 이벤트 순서 문제 해결을 위해 `Pressable`의 `onPressIn`으로 선택 처리하거나, `FlatList`를 `Portal`로 렌더.
  - 작업량: 2시간 / 보통
- **사진 변경 버튼 CTA 개선**: "사진 변경" 텍스트가 썸네일 위에 오버레이됨. 별도 버튼으로 분리하거나 아이콘 배지 방식으로 변경.
  - 작업량: 1.5시간 / 보통
- **하드코딩 패딩 수정**: `14px`, `6px` 등 → spacing 토큰.
  - 작업량: 30분 / 쉬움
- **필수/선택 필드 시각적 구분 강화**: `*` 표시 외에 선택 필드를 접이식(Collapsible) 섹션으로 분리. "추가 정보 (선택)" 헤더 아래 접기.
  - 작업량: 3시간 / 보통

#### ConfirmScreen.tsx

**P1 — 중요**
- **개별 아이템 제출 진행 표시**: 현재 일괄 제출만 표시. 각 카드에 진행 인디케이터(체크/스피너/실패 아이콘).
  - 파일: `ConfirmScreen.tsx` 아이템 카드 렌더링 + `handleSubmit`
  - 작업량: 3시간 / 보통
- **수정/삭제 버튼 크기 및 배치 개선**: 현재 작은 텍스트 버튼. 아이콘 버튼으로 변경하고 카드 우측에 드롭다운 메뉴 또는 스와이프 액션으로 전환.
  - 작업량: 2시간 / 보통
- **빈 아이템 목록 상태에서 등록 유도**: "아직 등록한 상품이 없습니다" + "상품 추가" 버튼.
  - 작업량: 1시간 / 쉬움

---

### 2.5 가격 비교 (`src/screens/price/PriceCompareScreen.tsx`)

**P0 — 즉시 수정**
- **찜하기 유니코드 "♥/♡" → HeartIcon 컴포넌트 교체**: 이미 `HeartIcon` 컴포넌트가 존재하는데 사용하지 않고 있음.
  - 파일: `PriceCompareScreen.tsx` 찜하기 버튼 영역
  - 작업량: 30분 / 쉬움

**P1 — 중요**
- **찜하기 토글 로딩 상태 추가**: 네트워크 요청 중 하트 아이콘에 스피너 또는 비활성 상태 표시. 현재 즉시 UI 변경 후 실패 시 롤백 없음.
  - 작업량: 2시간 / 보통
- **반경 필터 칩 디자인 개선**: 가로 스크롤 대신, 4개뿐이므로 화면에 모두 표시하는 게 나음. `flexWrap: 'wrap'` 또는 균등 분배.
  - 작업량: 1시간 / 보통
- **리스트/맵 토글 애니메이션**: 뷰 모드 전환 시 `LayoutAnimation` 또는 `Animated` 적용.
  - 작업량: 2시간 / 보통

#### StoreDetailScreen.tsx

**P1 — 중요**
- **대체 지도 앱 지원**: 현재 네이버 맵만. 카카오맵, 구글맵 폴백 추가. `Linking.canOpenURL()` 체크 후 선택 ActionSheet.
  - 작업량: 2시간 / 보통
- **매장 추가 정보 표시**: 전화번호, 웹사이트 등 가용한 정보가 있으면 표시.
  - 작업량: 1.5시간 / 보통

---

### 2.6 위시리스트 (`src/screens/wishlist/WishlistScreen.tsx`)

**P1 — 중요**
- **스와이프 삭제 제스처 추가**: 현재 삭제 버튼 확인 알림만. `react-native-gesture-handler`의 `Swipeable` 적용.
  - 파일: `WishlistScreen.tsx` 카드 렌더링
  - 작업량: 3시간 / 보통
- **가격 정보 없음 상태 명시적 표시**: `lowestPrice`가 null일 때 "아직 가격 정보 없음" 텍스트 + 가격 등록 유도 버튼.
  - 작업량: 1시간 / 보통

---

### 2.7 마이페이지 (`src/screens/mypage/`)

#### MyPageScreen.tsx

**P1 — 중요**
- **활동 카운트 로딩 상태 개선**: `'...'` 텍스트 → 작은 `SkeletonBox` 적용.
  - 파일: `MyPageScreen.tsx` 활동 요약 카드 렌더링
  - 작업량: 1시간 / 보통
- **메뉴 아이템 컴포넌트 추출**: 65줄 이상의 `MenuItem`이 화면 내부에 있음. `components/common/MenuItem.tsx`로 분리.
  - 파일: `MyPageScreen.tsx` → 신규 `components/common/MenuItem.tsx`
  - 작업량: 1시간 / 쉬움
- **미구현 기능 비활성 표시**: "알림 설정" 등 미구현 메뉴에 "준비중" 뱃지 + disabled 스타일.
  - 작업량: 1시간 / 보통

#### FaqScreen.tsx

**P0 — 즉시 수정**
- **useRef + forceUpdate 패턴 → useState로 교체**: `useRef<Set<string>>` + `forceUpdate()`는 비표준 React 패턴. `useState<Set<string>>` 또는 `useState<string[]>`로 교체.
  - 파일: `FaqScreen.tsx` 확장/축소 로직
  - 작업량: 1시간 / 쉬움

**P1 — 중요**
- **아코디언 펼침/접힘 애니메이션**: `LayoutAnimation.configureNext()` 또는 `react-native-reanimated`의 `Layout` transition 적용.
  - 파일: `FaqScreen.tsx` FAQ 아이템 토글
  - 작업량: 2시간 / 보통

#### MyPriceListScreen.tsx

**P1 — 중요**
- **카드 탭 액션 추가**: 현재 카드가 읽기 전용. 탭하면 해당 상품의 `PriceCompareScreen`으로 이동.
  - 파일: `MyPriceListScreen.tsx` 카드 렌더링
  - 작업량: 1시간 / 보통

#### LikedPricesScreen.tsx

**P1 — 중요**
- **미구현 화면 처리**: TODO로 남아있음. API 연동 전까지 "곧 제공될 예정이에요" EmptyState + 기대 기능 안내.
  - 파일: `LikedPricesScreen.tsx` 전체
  - 작업량: 30분 / 쉬움

---

## 3. 공통 컴포넌트 개선 사항

### 3.1 접근성 (전체 적용) — P0

현재 프로젝트에 접근성 속성이 거의 없다. 프로덕션 레벨에서는 최소한 아래 사항을 적용해야 한다.

**대상 파일: 모든 인터랙티브 컴포넌트**

| 적용 대상 | 추가할 속성 | 예시 |
|-----------|------------|------|
| 모든 버튼 | `accessibilityRole="button"`, `accessibilityLabel` | FAB: "가격 등록 버튼" |
| 아이콘 버튼 | `accessibilityLabel` (아이콘만으로는 의미 전달 불가) | 검색: "검색", 알림: "알림" |
| 이미지 | `accessibilityRole="image"`, `accessibilityLabel` | 상품 사진 |
| 토글/스위치 | `accessibilityRole="switch"`, `accessibilityState` | 이벤트 토글 |
| 입력 필드 | `accessibilityLabel`, `accessibilityHint` | "상품명 입력" |
| 토스트 | `accessibilityLiveRegion="polite"` | 토스트 메시지 |
| 로딩 | `accessibilityLabel="로딩 중"` | ActivityIndicator |

- 작업량: 전체 약 6~8시간 / 보통 (반복 작업이지만 모든 파일 수정 필요)

### 3.2 아이콘 컴포넌트 정리 — P1

**HeartIcon.tsx**
- `active`/`activeColor`/`inactiveColor` deprecated props 제거. `filled` + `color` 패턴으로 통일.
- 작업량: 30분 / 쉬움

**HomeIcon.tsx**
- `activeColor === '#222222'` 하드코딩 제거. `filled` prop으로 통일.
- 작업량: 30분 / 쉬움

**SearchIcon.tsx**
- 기본 색상 `'#AEAEB2'` → `colors.gray400` 테마 토큰 사용.
- 작업량: 15분 / 쉬움

**전체 아이콘**
- `accessibilityRole="image"` 추가 (데코레이션 아이콘 제외).
- 작업량: 1시간 / 쉬움

### 3.3 EmptyView vs EmptyState 통합 — P1

현재 `EmptyView`(단순 텍스트)와 `EmptyState`(아이콘+제목+부제+액션) 두 개가 공존. `EmptyView`를 제거하고 `EmptyState`로 일원화. 기존 `EmptyView` 사용처를 `EmptyState`로 마이그레이션.

- 영향 파일: `EmptyView.tsx` 삭제, `SearchScreen.tsx` 등 사용처 수정
- 작업량: 1.5시간 / 쉬움

### 3.4 스켈레톤 컴포넌트 개선 — P1

현재 3개의 스켈레톤이 각각 별도 하드코딩 치수를 가짐.

**개선 방향:**
1. 공통 `SkeletonCard` 컴포넌트에 `variant` prop 추가 (price/wishlist/rank).
2. 치수를 실제 카드 컴포넌트와 공유하는 상수로 통합.
3. shimmer 효과 추가 (`react-native-reanimated` 기반 그라디언트 애니메이션).

- 파일: `PriceCardSkeleton.tsx`, `WishlistCardSkeleton.tsx`, `PriceRankCardSkeleton.tsx` → 통합
- 작업량: 4시간 / 보통

### 3.5 Toast 큐 시스템 — P1

현재 토스트가 동시 발생하면 마지막 것만 표시된다.

**개선:**
1. `toastStore`에 `queue: ToastItem[]` 배열 추가.
2. 현재 토스트 종료 후 다음 토스트 자동 표시.
3. 동일 메시지 중복 방지 로직.

- 파일: `src/store/toastStore.ts`, `src/components/common/Toast.tsx`
- 작업량: 3시간 / 보통

---

## 4. 디자인 시스템 보강

### 4.1 누락 토큰 추가 — P1

`src/theme/` 수정:

**colors.ts 추가:**
```
success: '#4CAF50'        // 성공 상태
warning: '#FFC107'        // 경고 상태
successLight: '#E8F5E9'   // 성공 배경
warningLight: '#FFF8E1'   // 경고 배경
```

**spacing.ts 추가:**
```
radiusSm: 6               // 작은 라운드
radiusMd: 10              // 검색바 등
radiusLg: 16              // 카드
radiusXl: 24              // 바텀시트 상단
radiusFull: 9999           // 완전 원형
```

**typography.ts 추가:**
```
error: { fontSize: 12, color: colors.danger }    // 인라인 에러
disabled: { ...bodyMd, color: colors.gray400 }   // 비활성 텍스트
brand: { fontSize: 40, fontWeight: '800' }        // 앱 이름
```

- 작업량: 2시간 / 쉬움

### 4.2 borderRadius 하드코딩 일괄 교체 — P1

현재 `borderRadius: 10`, `borderRadius: 12`, `borderRadius: 16` 등이 각 파일에 흩어져 있다. 위 토큰 추가 후 grep으로 전체 교체.

- 대상: 전체 `src/` 디렉토리
- 작업량: 2시간 / 쉬움 (단순 치환이지만 테스트 필요)

---

## 5. UX 흐름 개선

### 5.1 가격 등록 중간 저장 — P0

사용자가 `ItemDetailScreen`에서 폼을 작성하다 뒤로가기하면 데이터가 전부 유실된다.

**해결:**
1. `src/store/priceRegisterStore.ts` 신규 생성.
2. 선택한 매장, 입력 방식, OCR 결과, 폼 데이터를 Zustand store에 저장.
3. 뒤로 가기 시 "작성 중인 내용이 있습니다. 나가시겠습니까?" 확인 다이얼로그.
4. `ConfirmScreen` 제출 완료 시 store 초기화.

- 파일: 신규 `priceRegisterStore.ts`, `ItemDetailScreen.tsx`, `StoreSelectScreen.tsx`, 네비게이션 리스너
- 작업량: 6시간 / 어려움

### 5.2 네트워크 에러 글로벌 핸들링 — P1

현재 각 화면에서 개별적으로 에러를 처리한다. API 클라이언트 레벨에서 글로벌 에러 인터셉터를 추가하여 네트워크 끊김 시 전체 화면 상단에 오프라인 배너 표시.

- 파일: `src/api/client.ts` (인터셉터 추가), 신규 `src/components/common/OfflineBanner.tsx`, `App.tsx`
- 작업량: 4시간 / 보통

### 5.3 Pull-to-Refresh 일관적 적용 — P1

`HomeScreen`, `WishlistScreen`에는 있지만 `NoticeListScreen`, `MyPriceListScreen` 등에는 없다. FlatList 사용하는 모든 목록 화면에 `RefreshControl` 적용.

- 대상: `NoticeListScreen.tsx`, `MyPriceListScreen.tsx`, `FaqScreen.tsx`
- 작업량: 1시간 / 쉬움

---

## 6. 우선순위 종합 정리

### P0 — 즉시 수정 (프로덕션 출시 전 반드시)

| # | 항목 | 파일 | 예상 시간 | 난이도 |
|---|------|------|----------|--------|
| 1 | 접근성 속성 전체 추가 | 모든 인터랙티브 컴포넌트 | 8h | 보통 |
| 2 | Alert → 인라인 폼 검증 (ItemDetailScreen) | `ItemDetailScreen.tsx` | 4h | 보통~어려움 |
| 3 | Alert → 인라인 에러 (LocationSetupScreen) | `LocationSetupScreen.tsx` | 2h | 보통 |
| 4 | 가격 등록 중간 저장 시스템 | 신규 store + 관련 화면 | 6h | 어려움 |
| 5 | 유니코드/이모지 → 아이콘 컴포넌트 교체 | 5개 파일 | 2h | 쉬움 |
| 6 | 매장 등록 폼 필드별 검증 | `StoreSelectScreen.tsx` | 3h | 보통 |
| 7 | FaqScreen forceUpdate 패턴 수정 | `FaqScreen.tsx` | 1h | 쉬움 |
| 8 | LoginScreen 폰트 사이즈 하드코딩 | `LoginScreen.tsx` | 15m | 쉬움 |
| **소계** | | | **~26h** | |

### P1 — 중요 (출시 후 빠르게)

| # | 항목 | 파일 | 예상 시간 | 난이도 |
|---|------|------|----------|--------|
| 9 | 디자인 토큰 보강 (colors, spacing, typography) | `theme/*` | 2h | 쉬움 |
| 10 | borderRadius 하드코딩 일괄 교체 | 전체 src | 2h | 쉬움 |
| 11 | 아이콘 컴포넌트 props 정리 (Heart/Home/Search) | `icons/*.tsx` | 1.5h | 쉬움 |
| 12 | EmptyView/EmptyState 통합 | common 컴포넌트 | 1.5h | 쉬움 |
| 13 | 스켈레톤 컴포넌트 통합 + shimmer | 3개 skeleton 파일 | 4h | 보통 |
| 14 | Toast 큐 시스템 | toastStore + Toast | 3h | 보통 |
| 15 | FAQ 아코디언 애니메이션 | `FaqScreen.tsx` | 2h | 보통 |
| 16 | 글로벌 네트워크 에러 핸들링 | api/client + 신규 | 4h | 보통 |
| 17 | Pull-to-Refresh 일관 적용 | 3개 리스트 화면 | 1h | 쉬움 |
| 18 | 카드 프레스 피드백 통일 (Pressable) | HomeScreen + 관련 | 2h | 보통 |
| 19 | 찜하기 로딩 상태 + HeartIcon 적용 | PriceCompareScreen | 2.5h | 보통 |
| 20 | 카메라 가이드 오버레이 | CameraScreen | 3h | 보통 |
| 21 | DatePicker 적용 | ItemDetailScreen | 3h | 보통 |
| 22 | 상품명 서제스천 UX 개선 | ItemDetailScreen | 2h | 보통 |
| 23 | MenuItem 컴포넌트 추출 | MyPageScreen → 신규 | 1h | 쉬움 |
| 24 | MyPriceList 카드 탭 액션 | MyPriceListScreen | 1h | 보통 |
| 25 | 스와이프 삭제 (위시리스트) | WishlistScreen | 3h | 보통 |
| 26 | 반경 필터 레이아웃 개선 | PriceCompareScreen | 1h | 보통 |
| 27 | 리스트/맵 토글 애니메이션 | PriceCompareScreen | 2h | 보통 |
| 28 | 대체 지도 앱 지원 | StoreDetailScreen | 2h | 보통 |
| 29 | 필수/선택 필드 시각 구분 | ItemDetailScreen | 3h | 보통 |
| 30 | 확인 화면 개별 제출 상태 | ConfirmScreen | 3h | 보통 |
| 31 | 로그인 프레스 피드백 + 딤 처리 | LoginScreen | 2h | 보통 |
| 32 | OnboardingIntro 슬라이드 줄바꿈 수정 | OnboardingIntroScreen | 30m | 쉬움 |
| 33 | 권한 화면 개별 상태 표시 | PermissionScreen | 2h | 보통 |
| **소계** | | | **~53h** | |

### P2 — 나이스투해브

| # | 항목 | 예상 시간 | 난이도 |
|---|------|----------|--------|
| 34 | i18n 문자열 추출 구조 | 8h | 보통 |
| 35 | FlatList 아이템 stagger 애니메이션 | 4h | 보통 |
| 36 | 인기 태그 자동 슬라이드 | 2h | 보통 |
| 37 | 카메라 셔터 애니메이션 | 1h | 쉬움 |
| 38 | 촬영 후 프리뷰 확인 단계 | 3h | 보통 |
| 39 | 온보딩 슬라이드 확장 | 2h | 쉬움 |
| 40 | 페이지네이션 닷 스프링 애니메이션 | 1h | 보통 |
| **소계** | | **~21h** | |

---

## 7. 실행 로드맵

### Phase 1: 기반 정비 (1~2일, ~10시간)

이 단계에서는 코드 품질과 디자인 시스템 기반을 다진다. 이후 모든 작업이 이 위에서 진행된다.

1. **디자인 토큰 보강** (#9) — 2시간
   - `colors.ts`에 success/warning 추가
   - `spacing.ts`에 radius 토큰 추가
   - `typography.ts`에 error/disabled/brand 추가
2. **borderRadius 하드코딩 일괄 교체** (#10) — 2시간
3. **아이콘 컴포넌트 정리** (#11) — 1.5시간
4. **EmptyView/EmptyState 통합** (#12) — 1.5시간
5. **FaqScreen forceUpdate 패턴 수정** (#7) — 1시간
6. **LoginScreen 폰트 하드코딩** (#8) — 15분
7. **유니코드/이모지 일괄 교체** (#5) — 2시간

### Phase 2: 핵심 UX 개선 (3~5일, ~25시간)

사용자 경험에 직접적으로 영향을 미치는 핵심 이슈를 해결한다.

1. **가격 등록 중간 저장** (#4) — 6시간
2. **폼 인라인 검증 (ItemDetail)** (#2) — 4시간
3. **폼 인라인 검증 (LocationSetup)** (#3) — 2시간
4. **매장 등록 폼 검증** (#6) — 3시간
5. **DatePicker 적용** (#21) — 3시간
6. **글로벌 에러 핸들링** (#16) — 4시간
7. **Toast 큐 시스템** (#14) — 3시간

### Phase 3: 접근성 (1~2일, ~8시간)

접근성은 Phase 2의 컴포넌트 수정이 끝난 뒤 일괄 적용하는 것이 효율적이다.

1. **전체 접근성 속성 추가** (#1) — 8시간
   - 화면별로 순회하며 accessibilityLabel, accessibilityRole 추가
   - Toast에 accessibilityLiveRegion 적용
   - 스크린 리더 테스트

### Phase 4: 인터랙션 & 애니메이션 (3~4일, ~20시간)

기능이 안정화된 후 사용자 만족도를 높이는 마이크로인터랙션을 추가한다.

1. **카드 프레스 피드백 통일** (#18) — 2시간
2. **FAQ 아코디언 애니메이션** (#15) — 2시간
3. **스켈레톤 shimmer 효과** (#13) — 4시간
4. **카메라 가이드 오버레이** (#20) — 3시간
5. **리스트/맵 토글 애니메이션** (#27) — 2시간
6. **찜하기 로딩 + HeartIcon** (#19) — 2.5시간
7. **로그인 프레스/딤 처리** (#31) — 2시간
8. **스와이프 삭제** (#25) — 3시간

### Phase 5: 나머지 P1 항목 (2~3일, ~15시간)

1. **Pull-to-Refresh 일관 적용** (#17) — 1시간
2. **MenuItem 추출** (#23) — 1시간
3. **MyPriceList 탭 액션** (#24) — 1시간
4. **반경 필터 레이아웃** (#26) — 1시간
5. **대체 지도 앱** (#28) — 2시간
6. **필수/선택 필드 구분** (#29) — 3시간
7. **확인 화면 개별 상태** (#30) — 3시간
8. **상품명 서제스천 UX** (#22) — 2시간
9. **OnboardingIntro 줄바꿈** (#32) — 30분
10. **권한 개별 상태** (#33) — 2시간

### Phase 6: 나이스투해브 (필요 시)

P2 항목을 여유 있을 때 진행. i18n은 해외 진출 계획 시 우선순위 상향.

---

## 8. 기술적 참고 사항

### 추가 추천 라이브러리

| 용도 | 라이브러리 | 이유 |
|------|-----------|------|
| 애니메이션 | `react-native-reanimated` v3 | LayoutAnimation보다 세밀한 제어 가능 |
| 날짜 선택 | `@react-native-community/datetimepicker` | 네이티브 DatePicker |
| 스와이프 액션 | `react-native-gesture-handler` (이미 설치됨) | Swipeable 컴포넌트 |
| 폼 검증 | `react-hook-form` + `zod` | 인라인 검증 체계화 |
| 스켈레톤 shimmer | `react-native-reanimated` 직접 구현 또는 `react-native-skeleton-placeholder` | shimmer 효과 |

### 테스트 체크리스트

각 Phase 완료 후:
1. 전체 화면 스크린 리더(TalkBack/VoiceOver) 테스트
2. 다양한 화면 크기 (SE, 일반, Pro Max / 소형~대형 Android)
3. 저속 네트워크 시뮬레이션 (로딩/에러 상태 확인)
4. 키보드 인터랙션 (특히 폼 화면)
5. 다크 모드 대응 여부 (현재 미지원이면 P2로 기록)

---

> 총 예상 작업량: P0 ~26시간 + P1 ~53시간 + P2 ~21시간 = **약 100시간**
> 풀타임 기준: 약 2.5~3주 (하루 6시간 순수 작업 기준)
> Phase 1~3 (프로덕션 최소 요건): 약 43시간 = 1~1.5주
