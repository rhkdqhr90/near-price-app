import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = MyPageScreenProps<'PrivacyPolicy'>;

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. 수집하는 개인정보 항목',
    body:
      '가. 소셜 로그인 시 수집 항목\n· 카카오 계정: 이메일, 닉네임, 프로필 이미지\n\n나. 서비스 이용 과정에서 자동 수집\n· 기기 정보 (기기 모델명, OS 버전)\n· 위치 정보 (동네 설정 시, 사용자 동의 후 수집)\n· 서비스 이용 기록',
  },
  {
    title: '2. 개인정보의 수집 및 이용 목적',
    body:
      '· 회원 식별 및 서비스 제공\n· 가격 등록 및 조회 서비스\n· 찜하기, 가격 알림 등 맞춤 서비스\n· 서비스 개선 및 통계 분석\n· 법적 의무 이행',
  },
  {
    title: '3. 개인정보의 보유 및 이용 기간',
    body:
      '회원 탈퇴 시 즉시 삭제됩니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.\n\n· 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)\n· 서비스 방문 기록: 3개월 (통신비밀보호법)',
  },
  {
    title: '4. 개인정보의 제3자 제공',
    body:
      '회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령의 규정에 의한 경우는 예외로 합니다.',
  },
  {
    title: '5. 개인정보 처리의 위탁',
    body:
      '회사는 서비스 향상을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.\n\n· AWS (Amazon Web Services): 서버 인프라 및 데이터 저장\n· Firebase (Google LLC): 푸시 알림(FCM) 서비스',
  },
  {
    title: '6. 이용자의 권리',
    body:
      '이용자는 언제든지 다음의 권리를 행사할 수 있습니다.\n· 개인정보 열람 요청\n· 개인정보 정정·삭제 요청\n· 처리 정지 요청\n· 회원 탈퇴 (서비스 내 탈퇴 기능 이용)',
  },
  {
    title: '7. 위치정보 처리',
    body:
      '앱은 동네 설정 기능을 위해 기기의 위치 정보를 수집할 수 있습니다. 위치 정보 수집에 동의하지 않을 경우 동네를 수동으로 설정하여 서비스를 이용할 수 있습니다.',
  },
  {
    title: '8. 개인정보 보호 책임자',
    body:
      '개인정보 처리에 관한 문의는 앱 내 "도움말/문의" 기능을 통해 연락해 주시기 바랍니다.',
  },
  {
    title: '9. 개인정보처리방침 변경',
    body:
      '이 개인정보처리방침은 2026년 3월 25일부터 적용됩니다. 변경이 있을 경우 서비스 내 공지사항을 통해 고지합니다.',
  },
];

const PrivacyPolicyScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }],
    [insets.bottom],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.effectiveDate}>시행일: 2026년 3월 25일</Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  effectiveDate: {
    ...typography.bodySm,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headingMd,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    color: colors.gray700,
    lineHeight: 24,
  },
});

export default PrivacyPolicyScreen;
