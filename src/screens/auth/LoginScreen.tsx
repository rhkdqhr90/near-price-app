import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { login } from '@react-native-seoul/kakao-login';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import type { AuthScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';


type Props = AuthScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setTokens, setUser } = useAuthStore();

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      const kakaoResult = await login();
      const res = await authApi.kakaoLogin({
        kakaoAccessToken: kakaoResult.accessToken,
      });
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      // RootNavigator가 isAuthenticated 변경을 감지하여 자동으로 LocationSetup 또는 MainTab으로 전환
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다';
      Alert.alert('로그인 실패', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.appName}>마실</Text>
        <Text style={styles.tagline}>내 주변 최저가 찾기</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.kakaoButton, isLoading && styles.kakaoButtonDisabled]}
          onPress={handleKakaoLogin}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.bodyMd,
    color: colors.gray600,
  },
  bottom: {
    paddingBottom: spacing.xxl,
  },
  kakaoButton: {
    backgroundColor: colors.kakaoYellow,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoButtonDisabled: {
    opacity: 0.6,
  },
  kakaoButtonText: {
    ...typography.headingMd,
    color: colors.black,
  },
});

export default LoginScreen;
