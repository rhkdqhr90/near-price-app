# NearPrice 코드 리뷰 체크리스트

검증 파이프라인(TypeScript → ESLint → 빌드) 통과 후 **반드시** 이 체크리스트를 점검한다.
하나라도 위반 발견 시 즉시 수정하고 재검증한다.

---

## 1. 사이드 이펙트

### React 상태/렌더링
- [ ] `useEffect` dependency array에 실제 사용하는 값이 전부 포함되어 있는가?
- [ ] `useEffect` cleanup 함수가 필요한 경우(타이머, 구독, 이벤트 리스너) 반환하는가?
- [ ] 컴포넌트 언마운트 후 `setState` 호출이 발생하는 경우가 없는가? (비동기 콜백 내)
- [ ] 렌더 중에 사이드 이펙트(API 호출, 전역 변수 변경 등)를 직접 실행하지 않는가?

### Zustand
- [ ] 로컬 UI 상태(모달 열림/닫힘, 입력값 등)가 전역 스토어에 들어가 있지 않은가?
- [ ] 스토어 액션이 예상치 못한 다른 슬라이스를 변경하지 않는가?
- [ ] `logout()` 호출 시 모든 민감 상태가 완전히 초기화되는가?

### React Query
- [ ] `invalidateQueries` 범위가 너무 광범위하지 않은가? (전체 캐시 날리기 금지)
- [ ] `mutationFn`이 성공 후 관련 쿼리만 정확히 invalidate하는가?
- [ ] `enabled` 옵션으로 불필요한 자동 fetch를 막고 있는가?
- [ ] `queryKey`가 의존하는 파라미터를 전부 포함하는가? (stale data 방지)

---

## 2. 잠재적인 버그

### null / undefined
- [ ] API 응답의 nullable 필드(`null | string` 등)에 대해 옵셔널 체이닝 또는 조건 분기를 사용하는가?
- [ ] `route.params`에서 받은 값을 바로 사용하기 전에 존재 여부를 확인하는가?
- [ ] 배열 `.find()`, `.filter()` 결과가 `undefined`일 수 있는 경우를 처리하는가?

### 비동기
- [ ] `async` 함수 내에서 `try/catch`나 `.catch()`로 에러를 처리하는가?
- [ ] 여러 비동기 호출의 실행 순서에 의존하는 race condition이 없는가?
- [ ] refresh token 인터셉터에서 무한 루프(401 → refresh → 401 → ...) 가능성이 없는가?
  - `_retry` 플래그 확인, refresh 요청 자체는 인터셉터에서 제외

### React Native 특이사항
- [ ] Android에서 이미지 URI가 `file://` 또는 `content://` 형식인지 확인하는가?
- [ ] 키보드가 올라올 때 `KeyboardAvoidingView` 또는 `behavior` 설정이 있는가? (입력 화면)
- [ ] `FlatList` / `SectionList`에서 `keyExtractor`가 고유한 값을 반환하는가? (`index` 사용 금지)
- [ ] 이미지 URL이 `http://`인 경우 `android:usesCleartextTraffic="true"` 또는 `${usesCleartextTraffic}` 설정이 되어 있는가?

### 타입
- [ ] `as` 타입 단언을 불필요하게 남용하지 않는가?
- [ ] `unknown` 타입을 좁히지 않고 바로 사용하지 않는가?

---

## 3. 보안

### 토큰 / 인증
- [ ] `accessToken`, `refreshToken`이 `console.log`, 에러 메시지, UI에 절대 노출되지 않는가?
- [ ] 401 응답 처리 시 refresh 실패 → `logout()` 호출이 보장되는가?
- [ ] refresh token이 만료되었을 때 무한 재시도 없이 즉시 로그아웃하는가?
- [ ] JWT 토큰을 `AsyncStorage`에 저장하는 것은 현재 스펙 허용 범위 (민감도 낮음)이지만, 불필요한 곳에 복사/전달하지 않는가?

### API 요청
- [ ] 사용자 입력이 포함된 API 파라미터를 그대로 URL에 삽입하지 않는가? (path injection)
- [ ] `multipart/form-data` 업로드 시 파일 타입/크기 검증이 UI 단에도 있는가? (서버 검증에만 의존 금지)
- [ ] 인증이 필요한 API(`⭐` 표시)는 반드시 토큰이 주입된 `apiClient`를 사용하는가?

### 화면 / 데이터 표시
- [ ] 서버에서 받은 문자열을 `dangerouslySetInnerHTML` 또는 `WebView`에 그대로 넘기지 않는가?
- [ ] 딥링크나 외부 URL 파라미터를 파싱할 때 검증 없이 네비게이션에 사용하지 않는가?
- [ ] 에러 응답의 `message` 필드를 사용자에게 그대로 노출하지 않는가? (내부 정보 유출)

---

## 4. 성능

- [ ] 컴포넌트가 불필요하게 자주 리렌더링되지 않는가? (객체/배열 리터럴을 props로 직접 전달 금지)
- [ ] 리스트가 길어질 수 있는 경우 `FlatList`를 사용하는가? (`ScrollView` + `map` 금지)
- [ ] 무거운 연산에 `useMemo`/`useCallback`을 적용했는가? (단, 과도한 최적화 금지)

---

## 점검 방법

```bash
# 파일 저장 후 PostToolUse 훅이 자동으로 tsc 실행
# 최종 완료 전 수동 실행:
.claude/scripts/verify.sh
```

위 체크리스트는 자동화할 수 없는 논리적 검토 항목이다.
코드 작성 완료 후 변경된 파일을 기준으로 해당 항목을 직접 검토한다.
