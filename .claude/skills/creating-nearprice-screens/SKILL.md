---
name: creating-nearprice-screens
description: NearPrice 앱에서 새 화면, API 훅, 컴포넌트를 만들 때 사용.
신규 화면 생성 / 네비게이션 추가 / React Query 훅 작성 시 반드시 이 Skills를 먼저 읽을 것.
---

# NearPrice 화면 생성 절차

## Phase 1 — 플랜 (구현 시작 전 필수)

### Step 1. 컨텍스트 파악

다음 파일을 순서대로 읽는다:

- CLAUDE.md — 프로젝트 규칙 + 제약 확인
- src/navigation/types.ts — 현재 등록된 화면 목록 확인
- src/types/api.types.ts — 사용 가능한 타입 확인

### Step 2. 구현 목록 작성 후 사용자 승인

아래 항목 중 이번 작업에 해당하는 것을 목록으로 작성한다:

```
[ ] navigation/types.ts — 신규 화면 파라미터 타입
[ ] api/<domain>.api.ts — API 함수
[ ] hooks/queries/use<Domain>.ts — React Query 훅
[ ] screens/<domain>/<Name>Screen.tsx — 화면 컴포넌트
[ ] <Navigator>.tsx — 화면 등록
[ ] components/ — 전용 하위 컴포넌트 (필요 시)
```

**목록을 사용자에게 보여주고 승인을 받는다. 승인 전 구현 절대 금지.**

---

## Phase 2 — 구현 (승인 후 순서대로)

### Step 3. 타입 먼저

`src/navigation/types.ts`에 새 화면 파라미터 타입 추가.
파라미터 없는 화면은 `undefined`.

참조: `references/screen-patterns.md` → "네비게이션 타입 안전" 섹션

### Step 4. API 레이어

`src/api/<domain>.api.ts` 작성.

- apiClient import는 반드시 `./client`에서
- 반환값은 AxiosResponse 그대로 (data 벗기기 금지 — 훅에서 함)

참조: `references/api-patterns.md` → "API 호출 함수" 섹션

### Step 5. React Query 훅

`src/hooks/queries/use<Domain>.ts` 작성.

- queryFn에서 반드시 `.then(res => res.data)`
- 쿼리 키는 반드시 keys 객체로 정의 (문자열 하드코딩 금지)
- useMutation은 onSuccess에서 관련 쿼리 invalidate

참조: `references/api-patterns.md` → "React Query 훅", "쿼리 키 규칙" 섹션

### Step 6. 화면 컴포넌트

`src/screens/<domain>/<Name>Screen.tsx` 작성.

데이터 fetch 화면은 3상태 필수 — 순서 지킬 것:

```typescript
if (isLoading) return <LoadingView />;
if (error) return <ErrorView message="..." onRetry={refetch} />;
if (!data?.length) return <EmptyView message="..." />;
```

참조: `references/screen-patterns.md` → "기본 화면 구조", "필수 3상태 처리" 섹션

### Step 7. 하위 컴포넌트 (필요 시)

- FlatList renderItem → 반드시 `memo` 적용
- StyleSheet.create 사용, 인라인 스타일 금지
- 색상/간격은 theme.ts에서 import

참조: `references/component-patterns.md` → "StyleSheet 규칙", "memo 사용 기준" 섹션

### Step 8. 네비게이션 등록

해당 Navigator 파일에 화면 추가.
Step 3에서 정의한 타입과 일치하는지 확인.

---

## Phase 3 — 검증

### Step 9. 완료 목록 대조

Phase 1 Step 2에서 작성한 목록과 대조.
체크 안 된 항목이 있으면 구현 후 재대조.

### Step 10. 자동 검증

```bash
.claude/scripts/verify.sh
```

실패 시 에러 수정 후 재실행. 통과할 때까지 완료 보고 금지.

---

## 절대 규칙 (위반 시 즉시 중단)

- 컴포넌트에서 직접 axios 호출 금지 → api/ 레이어 경유
- 서버 상태 Zustand 사용 금지 → React Query
- 클라이언트 상태 React Query 사용 금지 → Zustand
- 인라인 스타일 금지 → StyleSheet.create
- any 타입 금지
- 네비게이션 파라미터 타입 없이 navigate 금지

```

---

기존 Skills랑 비교하면 뭐가 달라졌는지 보여줄게.
```

기존 새 버전
──────────────────────── ────────────────────────
규칙 나열 Phase 1/2/3 실행 순서
references 참조만 있음 각 Step에 어느 섹션 읽을지 명시
승인 단계 없음 Step 2에서 승인 강제
3상태 언급만 있음 코드 패턴 직접 포함
