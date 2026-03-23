# NearPrice App (near-price-app)

크라우드소싱 + 자동화 하이브리드 가격 비교 모바일 앱. 사용자가 원하는 상품을 검색하고 주변 매장의 가격을 한눈에 비교하는 iOS/Android 네이티브 앱입니다.

**핵심 UX**: 검색 → 가격 순위 확인 → 제일 싼 데로 간다

## 기술 스택

- **Framework**: React Native CLI (Bare workflow) + TypeScript 5.x
- **상태관리**:
  - Zustand (클라이언트 상태: 인증, 위치)
  - React Query v5 (서버 상태: 상품, 가격, 찜)
- **네비게이션**: React Navigation (Bottom Tab + Stack)
- **네이티브 모듈**:
  - Google ML Kit v2 (OCR - 온디바이스)
  - @mj-studio/react-native-naver-map (지도)
  - react-native-camera (카메라)
- **API 클라이언트**: Axios
- **스타일링**: React Native StyleSheet + 디자인 토큰 (theme/)
- **HTTP**: Axios (토큰 인터셉터 포함)
- **패키지 매니저**: npm (pnpm/yarn 금지)

## 환경 설정

### 필수 환경
- Node.js 18+ & npm
- Ruby 2.7+ (iOS 빌드)
- Xcode 14+ (iOS)
- Android Studio + SDK 34+ (Android)

### 설치

```bash
# 1. 프로젝트 클론
git clone <repo>
cd near-price-app

# 2. 의존성 설치
npm install

# 3. 네이티브 의존성 (iOS)
cd ios
bundle install
bundle exec pod install
cd ..

# 4. 환경 파일 생성
cp .env.example .env
# .env에서 다음을 설정:
# - NAVER_CLIENT_ID (네이버클라우드 지도 API)
# - NAVER_CLIENT_SECRET (네이버 로컬 검색 API)
# - KAKAO_APP_KEY (카카오 OAuth)
# - API_BASE_URL (백엔드 API 주소)
```

## 개발 시작

### Metro 개발 서버 시작
```bash
npm start
```

### Android 빌드 및 실행
```bash
npm run android
# 또는 Android Studio에서 직접 빌드
```

### iOS 빌드 및 실행
```bash
npm run ios
# 또는 Xcode에서 직접 빌드 (ios/NearPrice.xcworkspace)
```

### 핫 리로드
앱 저장 시 자동으로 변경사항 반영 (Fast Refresh). 강제 새로고침:
- **Android**: `Ctrl+M` (또는 `Cmd+M` macOS) → "Reload"
- **iOS**: `Cmd+R` (iOS Simulator)

## 폴더 구조

```
near-price-app/
├── .claude/                   # Claude AI 통합
│   ├── agents/
│   │   └── rn-reviewer.md     # React Native 코드 리뷰 에이전트
│   ├── reviews/
│   │   └── code-review-checklist.md # 코드 리뷰 체크리스트
│   ├── skills/
│   │   └── creating-nearprice-screens/ # 화면 생성 스킬
│   └── scripts/
│       └── verify.sh          # TypeScript + ESLint 자동 검증
├── android/                   # Android 네이티브 코드
├── ios/                       # iOS 네이티브 코드
├── src/
│   ├── api/                   # API 호출 레이어 (Axios)
│   │   ├── client.ts          # Axios 인스턴스 (토큰 인터셉터)
│   │   ├── auth.api.ts        # 인증 API
│   │   ├── price.api.ts       # 가격 API
│   │   ├── product.api.ts     # 상품 API
│   │   ├── store.api.ts       # 매장 API
│   │   ├── wishlist.api.ts    # 찜 API
│   │   ├── verification.api.ts # 신뢰도 검증 API
│   │   └── badge.api.ts       # 뱃지 API
│   ├── components/            # 재사용 컴포넌트
│   │   ├── common/            # 공통 UI (Button, Toast, Skeleton 등)
│   │   ├── icons/             # SVG 아이콘 컴포넌트
│   │   ├── map/               # 지도 관련
│   │   └── price/             # 가격 관련
│   ├── hooks/                 # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── queries/           # React Query 훅들
│   ├── navigation/            # 네비게이션 설정
│   │   ├── RootNavigator.tsx  # 최상위 네비게이션
│   │   ├── AuthStack.tsx      # 인증 화면 스택
│   │   ├── MainTabNavigator.tsx # 메인 탭 네비게이션
│   │   ├── OnboardingNavigator.tsx
│   │   └── types.ts           # 네비게이션 파라미터 타입
│   ├── screens/               # 화면 컴포넌트
│   │   ├── auth/              # 로그인, 동네 설정
│   │   ├── onboarding/        # 권한 요청
│   │   ├── home/              # 홈 피드, 검색
│   │   ├── price/             # 가격 등록 플로우 (복잡)
│   │   ├── wishlist/          # 찜 목록
│   │   └── mypage/            # 마이페이지
│   ├── store/                 # Zustand 글로벌 상태
│   │   ├── authStore.ts       # 인증 상태
│   │   └── locationStore.ts   # 위치 상태
│   ├── theme/                 # 디자인 토큰 (Phase 1 완성)
│   │   ├── colors.ts          # 색상 (primary, success, warning 등)
│   │   ├── typography.ts      # 폰트 스타일
│   │   ├── spacing.ts         # 간격 & 반경
│   │   └── index.ts
│   ├── types/                 # TypeScript 타입
│   │   └── api.types.ts       # API 요청/응답 타입
│   └── utils/                 # 유틸 함수
│       ├── storage.ts         # AsyncStorage 래퍼
│       ├── format.ts          # 포맷팅 (가격, 날짜)
│       ├── constants.ts       # 상수
│       ├── config.ts          # 환경 설정
│       └── highlight.ts       # 텍스트 강조
├── .env.example               # 환경 변수 예시
├── App.tsx                    # 진입점
├── CLAUDE.md                  # Claude AI 프로젝트 컨텍스트
├── DESIGN_SYSTEM.md           # 디자인 시스템 스펙
├── package.json
└── tsconfig.json
```

## API 연동

### Base URL
- **개발**: `http://10.0.2.2:3000` (Android 에뮬레이터)
- **프로덕션**: 환경 변수 `API_BASE_URL` 참고

### 인증
모든 인증이 필요한 API (⭐ 표시)는 자동으로 `Authorization: Bearer {token}` 헤더가 추가됩니다.

```typescript
// 올바른 방법: api/ 레이어 경유
const { data } = await priceApi.getPrices(productId);

// 잘못된 방법: 컴포넌트에서 직접 호출 금지
const data = await axios.get('/prices');
```

API 스펙은 `/docs/API_SPEC.md` 참고.

## 개발 규칙

### 설계 원칙
1. **상품 가격이 주인공** — 매장은 부가 정보
2. **API 호출 캡슐화** — 모든 호출은 `src/api/` 레이어 경유
3. **상태 관리 역할 분리** — 서버 상태(React Query) ≠ 클라이언트 상태(Zustand)

### 필수 코딩 규칙
- 함수형 컴포넌트만 사용 (class 금지)
- StyleSheet.create 사용 (인라인 스타일 금지)
- theme/ 토큰 사용 (하드코딩 금지)
- 접근성 구현: `accessibilityRole`, `accessibilityLabel` 필수
- FlatList `keyExtractor`는 고유 ID 사용 (index 금지)
- console.log 커밋 금지
- any 타입 금지

자세한 규칙은 `CLAUDE.md` 참고.

## 검증 및 배포

### 자동 검증
```bash
.claude/scripts/verify.sh
```
TypeScript 타입 체크 + ESLint 실행

### 코드 리뷰
새 기능 또는 스크린 추가 후 항상 `rn-reviewer` 에이전트 호출 필수.

### 빌드
```bash
# Android
npm run android -- --mode=release

# iOS
npm run ios -- --configuration=Release
```

## 주요 의존성

| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| react-native | 모바일 프레임워크 | ^0.74 |
| react | UI 라이브러리 | ^18.2 |
| react-query | 서버 상태 관리 | ^5.x |
| zustand | 클라이언트 상태 관리 | ^4.x |
| react-navigation | 네비게이션 | ^6.x |
| axios | HTTP 클라이언트 | ^1.7 |
| @react-native-community/google-ml-kit | OCR | ^15.x |
| @mj-studio/react-native-naver-map | 지도 | ^latest |

## 환경 변수

`.env` 파일 설정:

```
# 백엔드 API
API_BASE_URL=http://10.0.2.2:3000

# 네이버 클라우드 플랫폼
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# 카카오
KAKAO_APP_KEY=your_kakao_app_key

# 앱 환경
ENV=development
```

## 문제 해결

### Metro 포트 충돌
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

### iOS 빌드 실패
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

### Android 에뮬레이터 네트워크
백엔드 API Base URL을 `10.0.2.2:3000` (에뮬레이터에서 호스트 localhost)로 설정.

## 참고 자료

- [React Native 공식 문서](https://reactnative.dev)
- [React Query 문서](https://tanstack.com/query/v5)
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [React Navigation 문서](https://reactnavigation.org)
- 프로젝트 컨텍스트: `CLAUDE.md`
- 디자인 시스템: `DESIGN_SYSTEM.md`
- API 스펙: `../docs/API_SPEC.md`
