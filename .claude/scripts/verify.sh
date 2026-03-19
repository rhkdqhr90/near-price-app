#!/bin/bash
# NearPrice 프론트엔드 자동 검증 스크립트
# Claude Code의 Stop hook에서 호출됨
# 실패 시 stdout으로 에러를 출력 → Claude가 읽고 자체 수정

cd "$(dirname "$0")/../.." || exit 0

ERRORS=""

# 1. TypeScript 타입체크
echo "🔍 TypeScript 타입체크 중..."
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?
if [ $TSC_EXIT -ne 0 ]; then
  ERRORS="${ERRORS}\n❌ TypeScript 타입 에러:\n${TSC_OUTPUT}\n"
fi

# 2. ESLint
echo "🔍 ESLint 검사 중..."
LINT_OUTPUT=$(npx eslint src/ --ext .ts,.tsx 2>&1)
LINT_EXIT=$?
if [ $LINT_EXIT -ne 0 ]; then
  ERRORS="${ERRORS}\n❌ ESLint 에러:\n${LINT_OUTPUT}\n"
fi

# 결과 출력
if [ -n "$ERRORS" ]; then
  echo ""
  echo "⚠️ 검증 실패 — 아래 에러를 수정해줘 (자동 재시도 남은 횟수 확인):"
  echo -e "$ERRORS"
  exit 1
else
  echo "✅ 검증 통과: TypeScript + ESLint 모두 OK"
  echo ""
  echo "📋 다음 체크리스트를 반드시 수동 점검하세요:"
  echo "   .claude/reviews/code-review-checklist.md"
  echo "   항목: 사이드 이펙트 / 잠재적 버그 / 보안 / 성능"
  exit 0
fi
