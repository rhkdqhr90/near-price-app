# NearPrice Frontend (near-price-app)

## 프로젝트 개요
크라우드소싱 + 자동화 하이브리드 가격 비교 앱의 모바일 클라이언트.
핵심 가치: "내가 살 거 제일 싼 데가 어디야"
사용자 경험: "검색 → 가격 순위 확인 → 제일 싼 데로 간다"

## 기술 스택
- React Native CLI (Bare workflow) + TypeScript
- 상태관리: Zustand (클라이언트 상태) + React Query (서버 상태)
- 네비게이션: React Navigation (Bottom Tab + Stack)
- OCR: Google ML Kit v2 (온디바이스)
- 지도: Naver Map SDK (`@mj-studio/react-native-naver-map`) — NCP 키 사용
- 역지오코딩 (좌표→동이름): Naver Reverse Geocoding API (`maps.apigw.ntruss.com/map-reversegeocode/v2`)
- 주소검색 (텍스트→좌표): Naver Geocoding API (`maps.apigw.ntruss.com/map-geocode/v2/geocode`)
- 매장검색: Naver Search API (`openapi.naver.com`)
- ⛔ 카카오 지도/로컬 API 사용 금지 — Kakao Developers 심사 탈락으로 OPEN_MAP_AND_LOCAL 서비스 비활성화됨. kakao-local.api.ts 의존 코드 전면 교체 완료 후 삭제 예정
- 인증: 카카오 OAuth → JWT Bearer 토큰
- HTTP: Axios
- 패키지 매니저: npm (pnpm/yarn 사용 금지)

## 백엔드 API
- Base URL (개발): http://10.0.2.2:3000 (Android 에뮬레이터)
- 인증 헤더: Authorization: Bearer {jwt_token}
- 백엔드 프로젝트: ~/Projects/near-price-api/

## 디렉토리 구조
```
src/
├── api/                    # API 호출 레이어 (Axios)
│   ├── client.ts           # Axios 인스턴스 (인터셉터, 토큰 주입)
│   ├── auth.api.ts
│   ├── price.api.ts
│   ├── product.api.ts
│   ├── store.api.ts
│   └── wishlist.api.ts
├── components/             # 재사용 컴포넌트
│   ├── common/             # LoadingView, ErrorView, EmptyView 등
│   └── price/              # PriceRankCard 등
├── hooks/                  # 커스텀 훅
│   └── queries/            # React Query 훅 (useProductPrices 등)
├── navigation/             # 네비게이션 설정
│   ├── RootNavigator.tsx
│   ├── AuthStack.tsx
│   ├── MainTabNavigator.tsx
│   └── types.ts
├── screens/                # 화면 컴포넌트
│   ├── auth/               # LoginScreen, LocationSetupScreen
│   ├── home/               # HomeScreen
│   ├── price/              # PriceCompareScreen, PriceRegisterScreen 등
│   ├── wishlist/           # WishlistScreen
│   └── mypage/             # MyPageScreen
├── store/                  # Zustand 스토어
│   ├── authStore.ts        # 인증 상태 (토큰, 유저)
│   └── locationStore.ts    # 위치 상태 (현재 동네)
├── types/                  # 공유 타입
│   └── api.types.ts        # API 요청/응답 타입
└── utils/
    ├── storage.ts          # AsyncStorage 래퍼
    ├── format.ts           # 가격 포맷팅
    └── theme.ts            # 색상, 간격 상수
```

## 설계 원칙
- 상품 가격이 주인공, 매장은 부가 정보
- API 호출은 반드시 api/ 레이어를 통해 (컴포넌트에서 직접 axios 금지)
- 서버 상태는 React Query, 클라이언트 상태는 Zustand (혼용 금지)

## 코딩 규칙 — 절대 위반 금지
1. 함수형 컴포넌트 + hooks만 사용 (class 컴포넌트 금지)
2. 컴포넌트 파일명: PascalCase (PriceCard.tsx)
3. 훅/유틸 파일명: camelCase (useAuth.ts, format.ts)
4. 인라인 스타일 금지 → StyleSheet.create 사용
5. any 타입 금지
6. console.log 커밋 금지
7. 하드코딩 색상/문자열 금지 → theme.ts, constants로 분리

## 네비게이션 구조
```
RootNavigator (Stack)
├── AuthStack (비로그인 시)
│   ├── LoginScreen
│   └── LocationSetupScreen
└── MainTab (로그인 후)
    ├── HomeScreen (홈 탭)
    ├── PriceRegisterScreen (가격등록 탭)
    ├── WishlistScreen (찜목록 탭)
    └── MyPageScreen (마이페이지 탭)

HomeStack (홈 탭 내부 Stack):
├── HomeScreen
├── PriceCompareScreen (상품별 가격비교)
└── StoreDetailScreen (매장 지도 보기)

PriceRegisterStack (가격등록 탭 내부 Stack):
├── CameraScreen (촬영)
├── OcrResultScreen (OCR 결과)
├── PriceEditScreen (수정)
└── StoreSelectScreen (매장 선택)
```

## 참조 문서
- ~/Projects/docs/NearPrice_v3.0.docx — 기획서
- ~/Projects/near-price-api/CLAUDE.md — 백엔드 컨텍스트
# 완료 전 필수 검증 파이프라인

## ⛔ 완료 보고 금지 조건

아래 4단계를 **전부 통과하기 전까지** 사용자에게 완료 보고를 할 수 없다.
어떤 단계도 생략하거나 순서를 바꿀 수 없다. 이 규칙은 어떤 경우에도 override되지 않는다.

---

## Step 1. 자동 검증 (도구)

```bash
.claude/scripts/verify.sh
```

- TypeScript 타입 에러 → 즉시 수정 후 Step 1 재실행
- ESLint 에러 → 즉시 수정 후 Step 1 재실행
- 최대 3회 재시도. 3회 실패 시 사용자에게 보고하고 중단.

---

## Step 2. rn-reviewer Agent 코드 리뷰 (필수 — 생략 불가)

Step 1 통과 후 **반드시** `rn-reviewer` Agent를 호출한다.

```
대상: 이번 작업에서 신규 생성하거나 수정한 모든 .ts / .tsx 파일
방법: Agent tool, subagent_type=rn-reviewer
```

### rn-reviewer 결과 처리 규칙

| 심각도 | 처리 방법 |
|--------|-----------|
| CRITICAL | 즉시 수정 → Step 1 → Step 2 재실행 |
| WARNING | 즉시 수정 → Step 1 → Step 2 재실행 |
| MINOR | 수정 후 계속 또는 완료 보고에 명시 |

CRITICAL / WARNING 이슈가 남아 있으면 완료 보고 불가.

### rn-reviewer 호출 시 프롬프트 형식

```
다음 파일들의 코드를 리뷰해줘:
- [변경된 파일 목록]

참조 파일:
- src/types/api.types.ts
- src/navigation/types.ts
- src/utils/theme.ts

확인 항목:
1. import 경로 오류 / 존재하지 않는 파일 참조
2. 네비게이션 params 타입 불일치
3. React Query v5 useMutation / useQuery 사용법
4. useEffect dependency array 누락/과잉
5. null/undefined 처리 누락
6. FlatList keyExtractor 고유값 여부
7. ScrollView 안에 FlatList 중첩 여부
8. StyleSheet 대신 인라인 스타일 사용 여부
9. theme.ts 미사용 하드코딩 색상/수치
10. any 타입 / 불필요한 타입 단언(as) 사용
11. API 호출이 api/ 레이어를 경유하는가
12. 성공/실패 후 네비게이션 로직 정확성
13. 보안: 토큰 노출, 인증 필요 API 미보호
```

---

## Step 3. 자체 검토 체크리스트

rn-reviewer 통과 후 변경 파일 기준으로 직접 확인:

1. [ ] API 호출이 api/ 레이어를 통하는가?
2. [ ] 서버 상태 React Query, 클라이언트 상태 Zustand (혼용 없음)?
3. [ ] 데이터 fetch 화면에 로딩/에러/빈 상태 3개 있는가?
4. [ ] 네비게이션 타입 정의 및 Screen 등록이 맞는가?
5. [ ] StyleSheet.create 사용, 인라인 스타일 없는가?
6. [ ] theme.ts 상수 사용, 하드코딩 색상/수치 없는가?
7. [ ] Props interface 정의되어 있는가?
8. [ ] any 타입 없는가?
9. [ ] console.log 없는가?
10. [ ] code-review-checklist.md 의 사이드이펙트/버그/보안/성능 항목 확인했는가?

하나라도 실패 시 수정 후 Step 1부터 재실행.

---

## Step 4. 완료 보고

아래 형식 그대로 보고. `rn-reviewer` 항목이 없으면 보고 무효.

```
✅ 구현 완료

변경 파일:
- src/screens/home/HomeScreen.tsx (신규)
- src/hooks/queries/usePrices.ts (신규)

검증 결과:
- TypeScript: ✅ 통과
- ESLint: ✅ 통과
- rn-reviewer: ✅ CRITICAL 0건 / WARNING 0건 / MINOR n건
- 빌드: ✅ 통과 (해당 Phase 이상)

자체 검토:
- 코딩 규칙 10개 전부 준수
- 3상태 처리 포함
- 네비게이션 타입 등록 확인
```

---

## 자동 수정 규칙

- 각 단계 실패 시 스스로 에러를 분석하고 수정한다
- Step 1~2 최대 3회 재시도. 3회 실패 시 사용자에게 보고하고 중단
- 수정할 때 기존 코드의 의도를 훼손하지 않는다

## 디자인 시스템
UI 구현 시 반드시 DESIGN_SYSTEM.md를 참조한다. 이 문서의 컬러, 타이포, 컴포넌트 스펙을 따르지 않는 코드는 리뷰 실패 처리한다.

## 작업 범위 규칙
- 프롬프트에 명시된 파일만 수정한다. 목록에 없는 파일은 절대 건드리지 않는다.
- 자체 판단 리팩토링 금지. 요청받은 작업만 수행한다.
- 리팩토링이 필요하다고 판단되면 수정하지 말고 보고만 한다.
