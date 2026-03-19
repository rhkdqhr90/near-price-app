# NearPrice 디자인 시스템

## 브랜드 컬러

```
Primary:     #00BFA5  (민트 — 메인 액션, 활성 탭, 강조 텍스트)
Primary-light: #E0F7F3  (민트 연한 — 배경, 배너)
Primary-dark:  #009688  (민트 진한 — pressed 상태)

Black:       #222222  (제목, FAB 배경)
Gray-900:    #333333  (본문)
Gray-600:    #888888  (보조 텍스트)
Gray-400:    #AEAEB2  (플레이스홀더)
Gray-200:    #E8E8E8  (카드 보더)
Gray-100:    #F5F5F5  (검색바 배경, 태그 배경)
White:       #FFFFFF  (카드 배경)

Danger:      #FF3B30  (마감할인 뱃지, 할인율)
Danger-light: #FFF0F0  (마감할인 뱃지 배경)

AD-bg:       #EEF4FF  (광고 배너 배경)
AD-text:     #8EADD4  (AD 뱃지 텍스트)
```

## 타이포그래피

```
시스템 폰트 사용: Platform.select({ ios: 'System', android: 'Roboto' })
절대 커스텀 폰트 쓰지 않는다.

heading-xl:  18px, weight 700, color #222, letterSpacing -0.3
heading-lg:  16px, weight 700, color #222, letterSpacing -0.3
heading-md:  15px, weight 600, color #222, letterSpacing -0.2
body:        14px, weight 400, color #333
body-sm:     12px, weight 400, color #888
caption:     11px, weight 400, color #AAA
caption-bold: 11px, weight 700
price:       17px, weight 700, color #222, letterSpacing -0.3
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

### 상단 헤더
```
좌측: 동네명 (heading-xl) + 아래 화살표 아이콘
우측: 검색 아이콘 + 알림 아이콘 (알림 빨간 dot 7px)
높이: 56px
배경: #FFFFFF
하단 보더 없음
```

### 검색바
```
배경: #F5F5F5
borderRadius: 10
padding: 12px 14px
좌측 검색 아이콘 (#AEAEB2) + 플레이스홀더 텍스트
보더 없음
터치 시 검색 화면으로 navigate
```

### 인기 검색 태그
```
배경: #F5F5F5
borderRadius: 20 (pill)
padding: 8px 16px
텍스트: 13px, weight 500, color #555
모든 태그 동일 색상 (절대 컬러풀하게 하지 않는다)
```

### 광고 배너 (마트 사장님 팜플렛)
```
배경: #EEF4FF
borderRadius: 12
padding: 16px
좌측: 매장 아이콘 (44x44 흰색 박스, borderRadius 10, 보더 0.5px #E0E0E0)
중앙: 매장명 (14px, weight 600) + 특가 정보 (12px, color #666)
우상단: "AD" 텍스트 (10px, weight 600, color #8EADD4)
```

### 가격 리스트 아이템 (★ 핵심)
```
개별 카드 스타일:
  배경: #FFFFFF
  borderRadius: 12
  border: 0.5px solid #E8E8E8
  padding: 16px
  marginBottom: 10px

좌측 컬러바:
  width: 3px
  borderRadius: 2px
  background: #00BFA5
  세로로 카드 높이만큼

좌측 텍스트:
  상품명 + 단위 (heading-md)
  매장명 · 거리 · 시간 (body-sm, 구분자 "·" color #DDD)

우측:
  최저가 (price 스타일)
  최고가 (11px, color #CCC, text-decoration line-through)
  "N곳 비교" (11px, weight 700, color #00BFA5)

마감할인 뱃지:
  background: #FFF0F0
  color: #FF3B30
  font-size: 10px, weight 700
  padding: 2px 6px
  borderRadius: 4
  상품명 옆에 inline
```

### 하단 탭바
```
3개 탭: 홈 / 찜 / MY
배경: #FFFFFF
상단 보더: 1px solid #F0F0F0
padding: 8px 0 30px (safe area 포함)

아이콘: SVG 24x24
활성: fill 처리, 라벨 color #222, weight 600
비활성: stroke만, 라벨 color #C0C0C0

홈 아이콘: house path (fill 활성)
찜 아이콘: heart path (stroke 비활성)
MY 아이콘: person path (stroke 비활성)

라벨: 10px, letterSpacing -0.2
```

### FAB (카메라 버튼)
```
position: absolute, right 20, bottom 82 (탭바 위)
width: 56, height: 56
borderRadius: 16 (둥근 사각형, 원형 아님)
background: #222222
카메라 SVG 아이콘 (stroke white, 26x26)
그림자: 0 2px 12px rgba(0,0,0,0.15)
```

## 레이아웃 규칙

```
화면 좌우 패딩: 20px
카드 간격: 10px
섹션 간격: 24px
헤더-콘텐츠 간격: 20px
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
