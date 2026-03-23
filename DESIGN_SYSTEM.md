# NearPrice 디자인 시스템

## 브랜드 컬러 (Phase 1 완성)

### 기본 색상
```
Primary:       #00BFA5  (민트 — 메인 액션, 활성 탭, 강조 텍스트, 체크마크)
Primary-light: #E0F7F3  (민트 연한 — 배경, 배너, secondary 버튼)
Primary-dark:  #009688  (민트 진한 — pressed 상태, 다크 모드 대비)

Black:         #222222  (제목, FAB 배경, 활성 탭 라벨)
Gray-900:      #333333  (본문 텍스트)
Gray-700:      #555555  (태그 텍스트)
Gray-600:      #888888  (보조 텍스트, 이미지 alt)
Gray-400:      #AEAEB2  (플레이스홀더, 비활성 아이콘)
Gray-200:      #E8E8E8  (카드 보더, 구분선)
Gray-100:      #F5F5F5  (검색바 배경, 태그 배경, 빈 상태 배경)
White:         #FFFFFF  (카드 배경, 전체 배경)

Tab-border:    #F0F0F0  (탭바 상단 보더)
Tab-icon-inactive: #C0C0C0 (비활성 탭 아이콘)
```

### 상태 색상 (Phase 1 신규 추가)
```
Success:       #4CAF50  (성공 상태, 확인 체크, 권한 허용 표시)
Success-light: #E8F5E9  (성공 배경, 권한 카드 배경)

Warning:       #FFC107  (경고, 주의 필요 표시)
Warning-light: #FFF8E1  (경고 배경)

Danger:        #FF3B30  (에러, 마감할인 뱃지, 할인율, 삭제)
Danger-light:  #FFF0F0  (에러 배경, 마감할인 뱃지 배경)
```

### 특수 색상
```
AD-bg:         #EEF4FF  (광고 배너 배경)
AD-text:       #8EADD4  (AD 뱃지 텍스트)

Camera-overlay: rgba(0,0,0,0.5) (카메라 뷰 오버레이)
Modal-overlay:  rgba(0,0,0,0.4) (모달 배경)
FAB-ripple:     rgba(255,255,255,0.25) (FAB 터치 리플)

Kakao-yellow:  #FEE500  (카카오 로그인 버튼)
```

### 색상 사용 규칙
```
src/theme/colors.ts에서 정의된 모든 색상을 사용.
컴포넌트에서 하드코딩 금지.

예:
✅ color: colors.primary
✅ backgroundColor: colors.successLight
❌ color: '#00BFA5'
❌ backgroundColor: '#E8F5E9'
```

## 타이포그래피 (Phase 1 완성)

### 시스템 폰트
```typescript
Platform.select({ ios: 'System', android: 'Roboto' })
// 절대 커스텀 폰트 사용 금지
```

### 타이포그래피 토큰 (src/theme/typography.ts)

| 토큰명 | 크기 | 무게 | 색상 | 라인높이 | 용도 |
|--------|------|------|------|---------|------|
| **heading-xl** | 18px | 700 | #222 | - | 상단 헤더 제목, 풀스크린 타이틀 |
| **heading-lg** | 16px | 700 | #222 | - | 섹션 제목, 카드 제목 |
| **heading-md** | 15px | 600 | #222 | - | 상품명, 카드 부제목 |
| **heading-base** | 17px | 600 | #222 | - | 선택된 항목명, 강조 텍스트 |
| **body** | 14px | 400 | #333 | 22px | 일반 본문 텍스트 |
| **body-md** | 15px | 400 | #333 | - | 중간 본문 |
| **body-sm** | 12px | 400 | #888 | - | 보조 텍스트, 매장명·거리 |
| **caption** | 11px | 400 | #AAA | - | 부가 설명, 날짜 |
| **caption-bold** | 11px | 700 | #AAA | - | 강조된 부가 설명 |
| **price** | 17px | 700 | #222 | - | 가격 표시 (핵심) |
| **tab-label** | 10px | 500 | - | - | 탭바 라벨 |
| **tag-text** | 13px | 500 | #555 | - | 인기 검색 태그 |
| **display-sm** | 24px | 700 | #222 | - | LocationSetupScreen 타이틀 |
| **activity-count** | 20px | 700 | #222 | - | MyPage 활동 카드 숫자 |
| **error** | 13px | 500 | #FF3B30 | - | 에러 메시지 |
| **disabled** | 14px | 400 | #AEAEB2 | - | 비활성 텍스트 |
| **brand** | 40px | 700 | #00BFA5 | - | 로그인 화면 브랜드 텍스트 |

### 사용 예시

```typescript
import { typography } from '../../theme/typography';

// 타이포그래피 토큰 적용
<Text style={typography.headingLg}>상품명</Text>
<Text style={typography.bodySm}>보조 텍스트</Text>
<Text style={typography.price}>12,800원</Text>

// StyleSheet에서 사용
const styles = StyleSheet.create({
  title: typography.headingMd,
  description: { ...typography.bodySm, marginTop: spacing.sm },
});
```

### 모든 텍스트에 letterSpacing 적용
```
heading-xl, heading-lg: -0.3px
heading-md, heading-base: -0.2px
tab-label: -0.2px
brand: -0.5px
```

## 아이콘

```
모든 아이콘은 react-native-svg로 직접 SVG 컴포넌트로 만든다.
이모지, PNG 아이콘 절대 금지.
stroke-width: 1.8
stroke-linecap: round
stroke-linejoin: round
활성: fill="#222" 또는 fill="#00BFA5"
비활성: stroke="#C0C0C0", fill="none"
크기: 탭바 24x24, 헤더 22x22, 인라인 16x16
```

## 컴포넌트 스펙

### 버튼 (Button.tsx)
```
variant: 'primary' (배경 민트) | 'secondary' (배경 연한 민트) | 'outline' (테두리) | 'ghost' (배경 없음)
size: 'sm' (32px) | 'md' (44px, 기본) | 'lg' (52px)
상태: disabled, loading

스타일:
  borderRadius: spacing.radiusMd (10px)
  접근성: accessibilityRole="button", accessibilityLabel

색상:
  primary: colors.primary (터치 시 colors.primaryDark)
  secondary: colors.primaryLight
  outline: 테두리 colors.primary, 텍스트 colors.primary
  ghost: 배경 없음, 텍스트 colors.primary
```

### 상단 헤더
```
좌측: 동네명 (heading-xl) + 아래 화살표 아이콘 (ChevronIcon)
우측: 검색 아이콘 + 알림 아이콘 (SearchIcon, BellIcon)
  - 알림 빨간 dot (width: 7px, 우상단)
높이: spacing.headerHeight (56px)
배경: colors.white
하단 보더: 없음 (상단에서는 보더 표시 안 함)
접근성: 동네명에 accessibilityRole="button"
```

### 검색바
```
배경: colors.gray100 (#F5F5F5)
borderRadius: spacing.radiusMd (10px)
padding: 12px 14px
좌측: SearchIcon (color: colors.gray400)
  플레이스홀더: "상품명으로 검색" (colors.gray400)
보더: 없음
터치 시: SearchScreen으로 navigate
접근성: accessibilityRole="search"
```

### 인기 검색 태그
```
배경: colors.gray100 (#F5F5F5)
borderRadius: spacing.radiusFull (9999px) — pill 모양
padding: 8px 16px
텍스트: typography.tagText (13px, weight 500, color #555)
마진: spacing.md (12px) 우측 + 하단

규칙: 모든 태그 단색 유지 (절대 다중 색상 금지)
```

### 메뉴 아이템 (MenuItem.tsx)
```
좌측: 아이콘 (16~24px) 또는 텍스트
중앙: 타이틀 (typography.body) + 부제 (typography.bodySm, 선택)
우측: ChevronIcon (회색) 또는 배지
높이: 44px (최소)
배경: colors.white
보더: 하단 1px colors.gray200
패딩: spacing.lg (16px) 좌우
터치 시: onPress 콜백

접근성: accessibilityRole="button", accessibilityHint 제공
```

### 오프라인 배너 (OfflineBanner.tsx)
```
배경: colors.danger (빨강)
높이: 40px
상단 고정 (포지션 절대 또는 상단 리스트)
텍스트: "오프라인 상태입니다. 인터넷 연결을 확인해주세요." (colors.white)
아이콘: WifiOffIcon (colors.white)

조건: isOffline (react-native-netinfo 또는 유사)
```

### 로딩 상태 (SkeletonCard, SkeletonBox)
```
SkeletonBox: 기본 회색 박스 (배경 #E8E8E8, 반경 6px)
SkeletonCard: 가격 카드 뼈대
  - 컬러바 (3px x 카드높이, colors.primary)
  - 좌측: 2줄 텍스트 라인 (각 8px 높이)
  - 우측: 가격 라인 + 비교 라인
  - 간격: cardGap (10px)
```

### 가격 리스트 아이템 (★ 핵심)
```
개별 카드 스타일:
  배경: colors.white
  borderRadius: spacing.radiusMd (10px)
  border: 0.5px solid colors.gray200
  padding: spacing.lg (16px)
  marginBottom: spacing.cardGap (10px)

좌측 컬러바:
  width: 3px
  borderRadius: spacing.radiusSm (6px)
  background: colors.primary
  세로로 카드 높이만큼

좌측 텍스트:
  상품명 + 단위: typography.headingMd
  매장명 · 거리 · 시간: typography.bodySm
    - 구분자 "·": colors.cardDivider (#DDD)
    - 부가 텍스트: colors.gray600

우측:
  최저가: typography.price (colors.primary)
  최고가: 11px, colors.cardPriceStrike (#CCC), line-through
  "N곳 비교": 11px, weight 700, colors.primary

마감할인 뱃지:
  background: colors.dangerLight (#FFF0F0)
  color: colors.danger (#FF3B30)
  font-size: 10px, weight 700
  padding: 2px 6px
  borderRadius: spacing.radiusSm (6px)
  상품명 옆에 inline

접근성: 카드에 accessibilityRole="button"
```

### 하단 탭바
```
탭 개수: 4개 (홈 / 가격등록 / 찜 / MY)
배경: colors.white
상단 보더: 1px solid colors.tabBorder (#F0F0F0)
padding: 8px 0 (하단은 safe area insets.bottom 포함)

탭 스타일:
  높이: spacing.tabBarContentHeight (56px)
  아이콘: SVG 24x24
  라벨: typography.tabLabel (10px, letterSpacing -0.2)

활성 탭: fill, 라벨 color colors.tabIconActive (#222), weight 600
비활성 탭: stroke, 라벨 color colors.tabIconInactive (#C0C0C0)

아이콘:
  - HomeIcon (fill)
  - ShoppingCartIcon 또는 CameraIcon (stroke)
  - HeartIcon (stroke)
  - PersonIcon (stroke)
```

### FAB (카메라 버튼)
```
position: absolute, right spacing.fabRight (20px), bottom: tabBarContentHeight + spacing.fabBottom (72px)
width: spacing.fabSize (56px)
height: spacing.fabSize (56px)
borderRadius: spacing.radiusLg (16px) — 둥근 사각형, 원형 금지
background: colors.black (#222222)
아이콘: CameraIcon (SVG, stroke colors.white, 26x26)
그림자: elevation: 8 (안드로이드) 또는 boxShadow (iOS)

상태: pressed 시 opacity 0.8
접근성: accessibilityRole="button", accessibilityLabel="카메라로 가격 등록"
```

### 토스트 알림 (Toast.tsx)
```
type: 'success' | 'warning' | 'error'
위치: 하단 중앙, safe area 고려
배경: 검은색 반투명 (rgba(0,0,0,0.8))
텍스트: 흰색, 14px, 최대 width: spacing.toastMaxWidth (320px)
padding: 12px 16px
borderRadius: spacing.radiusMd (10px)
표시 기간: 2초

z-index: spacing.zIndexToast (9999)
```

## 간격 & 반경 토큰 (Phase 1 완성)

### 기본 간격 (src/theme/spacing.ts)

| 토큰 | 값 | 용도 |
|------|-----|------|
| **xs** | 4px | 미세 조정 (예: 텍스트 라인 간격) |
| **sm** | 8px | 컴포넌트 내 간격 |
| **md** | 12px | 요소 간 기본 간격 |
| **lg** | 16px | 컴포넌트 패딩, 버튼 내부 |
| **xl** | 20px | 화면 좌우 패딩 (screenH), 섹션 구분 |
| **xxl** | 24px | 섹션 간 큰 간격 (sectionGap) |

### 레이아웃 간격

| 상수 | 값 | 용도 |
|------|-----|------|
| **screenH** | 20px | 화면 좌우 패딩 |
| **cardGap** | 10px | 카드 간의 세로 간격 |
| **sectionGap** | 24px | 섹션 간 간격 |
| **headerContent** | 20px | 헤더와 콘텐츠 간 간격 |
| **cardTextGap** | 6px | 카드 내 텍스트 간 간격 |

### 컴포넌트 크기

| 상수 | 값 | 용도 |
|------|-----|------|
| **headerHeight** | 56px | 상단 헤더 높이 |
| **tabBarContentHeight** | 56px | 하단 탭바 콘텐츠 높이 (insets.bottom 제외) |
| **fabSize** | 56px | FAB 버튼 크기 |
| **fabRight** | 20px | FAB 우측 여백 |
| **fabBottom** | 16px | FAB 하단 여백 (탭바 상단으로부터) |

### 반경 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| **radiusSm** | 6px | 작은 버튼, 배지 |
| **radiusMd** | 10px | 검색바, 일반 버튼 |
| **radiusLg** | 16px | FAB (둥근 사각형) |
| **radiusXl** | 24px | 큰 모달, 바텀시트 |
| **radiusFull** | 9999px | 완전 원형 (사용 자제) |

### 사용 예시

```typescript
import { spacing } from '../../theme/spacing';

<View style={{ paddingHorizontal: spacing.screenH, marginVertical: spacing.sectionGap }}>

// StyleSheet
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl, // 20px
    marginBottom: spacing.cardGap, // 10px
    borderRadius: spacing.radiusMd, // 10px
  },
});
```

## 레이아웃 규칙

```
화면 좌우 패딩: spacing.screenH (20px)
카드 간격: spacing.cardGap (10px)
섹션 간격: spacing.sectionGap (24px)
헤더-콘텐츠 간격: spacing.headerContent (20px)
반경: spacing.radiusMd (10px) — 일반, spacing.radiusLg (16px) — FAB
```

## 절대 하지 말 것

```
- 이모지를 아이콘으로 쓰지 않는다 (SVG만)
- 하드코딩 색상 쓰지 않는다 (theme.ts 상수만)
- 인라인 스타일 쓰지 않는다 (StyleSheet.create만)
- 여러 색상 태그 만들지 않는다 (단색 #F5F5F5만)
- 카드에 그림자 넣지 않는다 (0.5px 보더만)
- 둥근 원형 FAB 만들지 않는다 (둥근 사각형 borderRadius 16)
- react-native-vector-icons 쓰지 않는다 (react-native-svg만)
```


## 가격 등록 플로우

### 전체 흐름
```
FAB 탭 → 1.매장선택 → 2.입력방식 → (2A.카메라+OCR / 2B.수동입력)
→ 3.품목상세폼 → 4.추가등록? → (Yes→2단계 / No→5.확인+저장)
```

### 1. 매장 선택 화면 (StoreSelectScreen)
```
상단: "어디서 장보고 계세요?" 타이틀
GPS 위치: 현재 위치 자동 감지, 지도 미니맵 (선택)
매장 리스트: 반경 500m 내 등록된 매장 표시
  - 매장명 + 거리 + 주소
  - 카카오 로컬 API 검색 바
미등록 매장: "새 매장 등록" 버튼
  - 매장명 입력 (필수, 사용자가 입력)
  - 위치 자동 (GPS 좌표 자동 저장)
  - 카테고리 선택 (마트/시장/슈퍼/편의점)
```

### 2. 입력 방식 선택 (InputMethodScreen)
```
선택된 매장명 표시 (상단)
두 개 큰 카드 버튼:
  📷 "사진으로 등록" — 가격표 촬영 → OCR 자동 인식
  ✏️ "직접 입력" — 수동으로 품목 정보 입력
  (아이콘은 SVG, 이모지 아님)
```

### 2A. 카메라 + OCR (CameraScreen → OcrResultScreen)
```
CameraScreen:
  - 전체 화면 카메라 뷰
  - 하단: 촬영 버튼 (원형, 흰색 테두리)
  - 상단: 갤러리 선택 버튼
  - 가이드 텍스트: "가격표를 촬영해주세요"

OcrResultScreen:
  - 상단: 원본 사진 (스크롤 가능)
  - 하단: OCR 추출 결과 리스트
    - 각 항목: 상품명 + 가격 (자동 추출)
    - 터치하면 3단계(품목상세폼)으로 이동
    - "인식이 안 됐나요? 직접 입력" 링크
```

### 2B. 수동 입력
```
바로 3단계(품목상세폼)으로 이동
사진 필드는 선택으로 변경 (OCR 경로에서는 필수)
```

### 3. 품목 상세 폼 (ItemDetailScreen)
```
상단: 매장명 표시 (변경 불가)

폼 필드 (위에서 아래):
  상품명 (필수)
    - OCR에서 넘어왔으면 자동 채움
    - 텍스트 입력 + Elasticsearch 자동완성
    - placeholder: "예: 양파, 계란, 삼겹살"

  가격 (필수)
    - OCR에서 넘어왔으면 자동 채움
    - 숫자 키패드
    - "원" 단위 suffix
    - placeholder: "0"

  단위 (선택, 기본값 없음)
    - 드롭다운: kg / g / 개 / 구 / 팔 / 봉 / 팩 / 근 / 마리 / 직접입력
    - 수량 입력 (예: 1kg, 30구, 600g)

  이벤트/할인 여부 (토글)
    - OFF: 기간 필드 숨김
    - ON: 아래 기간 선택 표시
      - 시작일 ~ 종료일 (달력 피커)
      - "오늘만" 퀵버튼

  사진 (필수 — OCR 경로)
    - OCR에서 넘어왔으면 이미 첨부됨
    - 수동 경로면 촬영/갤러리 선택
    - 썸네일 미리보기

  품질 (선택)
    - 상 / 중 / 하 세그먼트 버튼
    - 기본값: 선택 안 함

  메모 (선택)
    - 여러 줄 텍스트
    - placeholder: "참고할 내용이 있다면"
    - 최대 200자

하단: "등록" 버튼 (#00BFA5, 전체 너비)
```

### 4. 추가 등록 (모달 or 바텀시트)
```
"같은 매장에서 더 등록할까요?"
  "네, 더 등록할게요" → 2단계(입력방식)로 이동, 매장 유지
  "아니요, 완료할게요" → 5단계(확인)로 이동
```

### 5. 확인 + 저장 (ConfirmScreen)
```
상단: 매장명 + 등록 일시
등록 아이템 리스트:
  - 각 아이템: 사진 썸네일 + 상품명 + 가격 + 단위
  - 스와이프로 개별 삭제 가능
  - 터치로 수정 가능 (3단계로 이동)

하단: "전체 등록" 버튼 (#00BFA5)
등록 완료 시: 성공 애니메이션 → 홈으로 이동
```
