---
name: creating-nearprice-screens
description: Generates React Native screens and components following NearPrice frontend conventions. Creates screens, API hooks, navigation setup, and styled components. Use when creating new screens, adding components, setting up navigation routes, or writing React Query hooks in the NearPrice app.
---

# NearPrice React Native 화면/컴포넌트 생성 규칙

## 화면(Screen) 생성 구조

```
src/screens/<domain>/
  <DomainName>Screen.tsx       # 메인 화면 컴포넌트
  components/                  # 화면 전용 하위 컴포넌트
    <SubComponent>.tsx
```

## 절대 규칙

1. **API 직접 호출 금지** → 반드시 `api/` 레이어 + React Query 훅 경유
2. **서버 상태 Zustand 금지** → React Query만 사용
3. **클라이언트 상태 React Query 금지** → Zustand만 사용
4. **인라인 스타일 금지** → StyleSheet.create
5. **any 타입 금지**
6. **console.log 금지**
7. **데이터 fetch 화면은 3상태 필수** → 로딩/에러/빈 상태

## 패턴 상세

상세 코드 패턴은 `references/` 참조:

- `references/screen-patterns.md` — Screen 구조, 3상태 처리, 네비게이션 타입
- `references/api-patterns.md` — Axios 인스턴스, React Query 훅, 쿼리 키 규칙
- `references/component-patterns.md` — 재사용 컴포넌트, StyleSheet, theme 상수
