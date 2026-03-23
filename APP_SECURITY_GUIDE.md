# NearPrice 앱 보안 가이드

프로덕션 배포 전 확인해야 할 보안 요사항들입니다.

## 1. 환경 변수 관리

### 현재 상태
- `.env` 파일에 민감한 정보 저장 가능
- 빌드 시 `react-native-config`로 로드

### 개선 사항

#### .env 파일 보호
```bash
# .env 파일을 .gitignore에 추가 (이미 되어 있어야 함)
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
```

#### 비공개 .env 파일 생성
```bash
# 개발 환경
cp .env.example .env.development

# 프로덕션 환경
cp .env.example .env.production

# 스테이징 환경
cp .env.example .env.staging
```

#### 환경별 빌드 설정
```bash
# 개발 빌드
ENVFILE=.env.development npm run android

# 프로덕션 빌드
ENVFILE=.env.production npm run build-production-android
```

### 민감한 데이터 미포함

`.env` 파일에 절대 포함하면 안 될 정보:
- ❌ API 비밀키 (Kakao REST API Key 등)
- ❌ JWT 비밀키
- ❌ 데이터베이스 비밀번호
- ❌ 관리자 계정 정보
- ❌ AWS 액세스 키 등

---

## 2. API 통신 보안

### HTTPS 사용 (필수)

```typescript
// src/utils/config.ts
export const API_BASE_URL =
  Config.API_BASE_URL ??
  (__DEV__ ? 'http://10.0.2.2:3000' : 'https://api.nearprice.com');
  // ^^^^^^^^ 개발 환경에서만 HTTP 허용
```

**프로덕션 환경에서는 반드시 HTTPS 사용**

### Certificate Pinning (선택사항)

```typescript
// 중요 API 요청에 인증서 피닝 적용
import { Platform } from 'react-native';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  httpAgent: Platform.OS === 'android' ? {...} : undefined,
  httpsAgent: Platform.OS === 'ios' ? {...} : undefined,
});
```

참고: [react-native-tcp-socket 라이브러리](https://github.com/PeculiarVentures/react-native-tcp-socket)

### API 요청 타임아웃

```typescript
// src/api/client.ts - 이미 설정되어 있음
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃 (적절함)
  headers: { 'Content-Type': 'application/json' },
});
```

---

## 3. 토큰 보안

### 현재 구현 (AsyncStorage)

```typescript
// src/api/client.ts
const token = useAuthStore.getState().accessToken;
config.headers.Authorization = `Bearer ${token}`;
```

### 문제점

AsyncStorage는 평문으로 저장됨:
- 🚨 Root/Jailbreak된 기기에서 접근 가능
- 🚨 ADB (Android Debug Bridge)로 접근 가능

### 개선 방안 1: Secure Storage (권장)

```bash
npm install react-native-keychain
```

```typescript
// src/store/secureAuthStore.ts
import * as Keychain from 'react-native-keychain';

interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export const secureAuthStore = {
  async saveTokens(accessToken: string, refreshToken: string) {
    await Keychain.setGenericPassword(
      'nearprice_auth',
      JSON.stringify({ accessToken, refreshToken }),
      {
        service: 'nearprice_auth',
        storage: Keychain.STORAGE_TYPE.KC, // iOS Keychain
        // Android: Keychain.STORAGE_TYPE.AES (암호화된 공유 환경설정)
      }
    );
  },

  async getTokens(): Promise<TokenData | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'nearprice_auth',
      });
      if (!credentials) return null;
      return JSON.parse(credentials.password);
    } catch (error) {
      console.error('Token retrieval failed:', error);
      return null;
    }
  },

  async clearTokens() {
    await Keychain.resetGenericPassword({
      service: 'nearprice_auth',
    });
  },
};
```

### 개선 방안 2: EncryptedSharedPreferences (Android)

```bash
npm install react-native-encrypted-preferences
```

```typescript
// Android의 경우
import { EncryptedPreferences } from 'react-native-encrypted-preferences';

const saveToken = async (key: string, value: string) => {
  await EncryptedPreferences.setItem(key, value);
};

const getToken = async (key: string) => {
  return await EncryptedPreferences.getItem(key);
};
```

### 개선 방안 3: iOS Keychain 커스텀

```swift
// ios/NearPrice/KeychainManager.swift
import Security

class KeychainManager {
  static let shared = KeychainManager()

  func save(_ key: String, value: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecValueData as String: value.data(using: .utf8)!,
    ]
    SecItemAdd(query as CFDictionary, nil)
  }

  func retrieve(_ key: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecReturnData as String: kCFBooleanTrue!,
    ]
    var result: AnyObject?
    SecItemCopyMatching(query as CFDictionary, &result)
    if let data = result as? Data {
      return String(data: data, encoding: .utf8)
    }
    return nil
  }
}
```

### Token 갱신 로직 개선

```typescript
// src/api/client.ts에 이미 구현되어 있음
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !config._retry) {
      // 토큰 갱신 로직
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        setTokens(res.data.accessToken, res.data.refreshToken);
        return apiClient(config);
      } catch (err) {
        logout(); // 로그아웃 처리
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 4. 민감한 데이터 처리

### 위치 정보

```typescript
// 위치 정보는 필요한 경우에만 수집
// src/screens 에서 사용할 때
import { requestLocationPermission } from '../utils/permissions';

// 사용자 동의 후에만 수집
const hasPermission = await requestLocationPermission();
if (hasPermission) {
  const location = await getCurrentLocation();
  // 위치 정보는 로컬에서만 처리 또는 서버로 전송
}
```

### 이미지/카메라 접근

```typescript
// src/api/upload.api.ts
// 앱에서만 처리, 서버로 전송 전 스캔

import { ImagePicker } from '../utils/imagePicker';

const uploadImage = async (uri: string) => {
  // 1. 로컬에서 이미지 유효성 검사
  const isValid = await validateImage(uri);
  if (!isValid) throw new Error('Invalid image');

  // 2. 압축
  const compressed = await compressImage(uri);

  // 3. 업로드
  const response = await apiClient.post('/upload', {
    file: compressed,
  });
  return response.data;
};
```

### 사용자 입력값 검증

```typescript
// src/utils/validation.ts 예시
export const validateNickname = (nickname: string): boolean => {
  // 금지된 단어 확인
  const bannedWords = ['admin', 'root', 'system'];
  if (bannedWords.some(word => nickname.toLowerCase().includes(word))) {
    return false;
  }

  // 길이 확인
  if (nickname.length < 2 || nickname.length > 20) {
    return false;
  }

  // 특수문자 확인
  const validPattern = /^[가-힣a-zA-Z0-9_-]+$/;
  return validPattern.test(nickname);
};
```

---

## 5. 권한 관리

### 권한 요청 (프로덕션)

```typescript
// src/utils/permissions.ts
import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '위치 정보 권한',
          message: '근처 가게 검색을 위해 위치 정보가 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }
  return true; // iOS는 Info.plist에 설정
};

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: '카메라 권한',
          message: '상품 가격을 촬영하기 위해 카메라가 필요합니다.',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }
  return true;
};
```

---

## 6. 난독화 및 코드 보호

### Android ProGuard 설정

```gradle
// android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

```properties
# android/app/proguard-rules.pro
# NestJS API 클래스는 keep (필요시)
-keep class com.nearprice.** { *; }

# 민감한 메서드 난독화 제외 (필요시)
-keepclassmembers class * {
    *** getToken(...);
    *** getRefreshToken(...);
}
```

### iOS 코드 보호

```bash
# Xcode에서 "Dead Code Stripping" 활성화
# Build Settings → Linking → Dead Code Stripping → Yes
```

---

## 7. 로깅 및 디버깅

### 프로덕션에서 로깅 비활성화

```typescript
// src/utils/logger.ts
const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    // 에러는 항상 로깅 (프로덕션 모니터링용)
    console.error(...args);
  },
};
```

### 민감한 정보 제거

```typescript
// 토큰이 로그에 노출되지 않도록 주의
logger.log('Auth headers:', headers); // ❌ 위험
logger.log('Request sent'); // ✅ 안전
```

---

## 8. 앱 배포 체크리스트

### Android 릴리스 빌드

```bash
# 1. 서명 키 생성 (처음 한 번만)
keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias nearprice

# 2. Gradle 설정 (android/app/build.gradle)
signingConfigs {
  release {
    keyAlias 'nearprice'
    keyPassword 'your-key-password'
    storeFile file('release.keystore')
    storePassword 'your-store-password'
  }
}

# 3. 빌드
cd android && ./gradlew bundleRelease
# APK: ./android/app/build/outputs/apk/release/app-release.apk
# AAB (권장): ./android/app/build/outputs/bundle/release/app-release.aab
```

### iOS 릴리스 빌드

```bash
# 1. Xcode에서 릴리스 스킴 선택
# 2. Archive 생성
# 3. App Store Connect에 업로드

# CLI에서 빌드
cd ios
xcodebuild -workspace NearPrice.xcworkspace \
  -scheme NearPrice \
  -configuration Release \
  -derivedDataPath build \
  archive -archivePath build/NearPrice.xcarchive
```

### 보안 검증

- [ ] `.env` 파일에 민감 정보 없음
- [ ] HTTPS 사용 확인
- [ ] 토큰이 안전한 저장소에 보관됨
- [ ] ProGuard/난독화 활성화됨
- [ ] 개발 환경 로깅 비활성화됨
- [ ] 권한 요청 메시지 설정됨
- [ ] API 타임아웃 설정됨
- [ ] 에러 처리가 민감 정보 노출 안 함
- [ ] 앱 스토어/플레이 스토어 검토 완료

---

## 9. 모니터링 및 로깅

### Sentry 연동 (에러 추적)

```bash
npm install @sentry/react-native
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: Config.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.ReactNativeTracing(),
  ],
});
```

### Firebase Crashlytics (모니터링)

```bash
npm install @react-native-firebase/crashlytics @react-native-firebase/app
```

```typescript
// App.tsx
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
```

---

## 10. 정기적인 보안 감사

### 의존성 취약점 확인

```bash
# npm audit 실행
npm audit

# 자동 수정 (주의: 버전 변경 가능)
npm audit fix --force
```

### OWASP Mobile Top 10 검증

| 항목 | 상태 | 설명 |
|------|------|------|
| Improper Platform Usage | ✅ | 권한 관리 |
| Insecure Data Storage | ⚠️ | Keychain/EncryptedSharedPreferences 사용 필요 |
| Insecure Communication | ✅ | HTTPS 사용 |
| Insecure Authentication | ✅ | JWT 토큰 기반 |
| Reverse Engineering | ⚠️ | ProGuard 난독화 필요 |
| Extraneous Functionality | ✅ | Debug 코드 제거 |
| Insecure Data Storage | ✅ | 토큰 암호화 저장 |
| Broken Cryptography | ✅ | 프레임워크 기본 암호화 사용 |
| Weak Key Management | ✅ | 서버에서 관리 |
| Extraneous Functionality | ✅ | 개발 코드 제거 |

---

## 참고 자료

- [OWASP Mobile Security Testing Guide](https://mobile-security.gitbook.io/mobile-security-testing-guide/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [Android Security Best Practices](https://developer.android.com/topic/security)
- [iOS Security Overview](https://developer.apple.com/security/)

---

**최종 업데이트**: 2026-03-20
**상태**: 개선 권장
