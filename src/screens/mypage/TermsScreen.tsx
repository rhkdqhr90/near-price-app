import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { APP_VERSION } from '../../utils/config';

type Props = MyPageScreenProps<'Terms'>;

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '제1조 (목적)',
    body:
      '이 약관은 NearPrice(이하 "서비스")를 운영하는 회사(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (용어의 정의)',
    body:
      '"회원"이란 서비스에 가입하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.\n"서비스"란 회사가 제공하는 동네 마트·시장 가격 비교 및 등록 기능 일체를 말합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body:
      '이 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.\n회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지된 날로부터 7일 이후 효력이 발생합니다.',
  },
  {
    title: '제4조 (서비스의 제공)',
    body:
      '회사는 다음과 같은 서비스를 제공합니다.\n· 동네 마트/시장 상품 가격 등록 및 조회\n· 상품별 최저가 비교\n· 가격 검증(맞아요/달라요) 기능\n· 찜하기 및 가격 알림 기능\n· 기타 회사가 추가 개발하는 서비스',
  },
  {
    title: '제5조 (회원가입 및 탈퇴)',
    body:
      '회원가입은 카카오 계정을 통한 소셜 로그인으로 이루어집니다.\n회원은 언제든지 서비스 내 탈퇴 기능을 통해 탈퇴할 수 있으며, 탈퇴 시 개인 정보는 관계 법령에 따라 처리됩니다.',
  },
  {
    title: '제6조 (회원의 의무)',
    body:
      '회원은 다음 행위를 하여서는 안 됩니다.\n· 허위 가격 정보 등록\n· 타인의 정보 도용\n· 서비스의 정상적인 운영을 방해하는 행위\n· 기타 관련 법령에 위반되는 행위',
  },
  {
    title: '제7조 (등록 콘텐츠)',
    body:
      '회원이 서비스에 등록한 가격 정보의 저작권은 원칙적으로 회원에게 귀속되나, 회사는 서비스 운영 및 개선을 위해 해당 정보를 익명으로 활용할 수 있습니다.',
  },
  {
    title: '제8조 (면책 조항)',
    body:
      '회사는 등록된 가격 정보의 정확성을 보증하지 않습니다. 가격 정보는 사용자가 직접 등록한 크라우드소싱 데이터이며, 실제 판매 가격과 다를 수 있습니다.',
  },
  {
    title: '제9조 (분쟁 해결)',
    body:
      '서비스 이용과 관련하여 발생한 분쟁에 대해서는 대한민국 법률을 적용하며, 관할 법원은 회사 본점 소재지 관할 법원으로 합니다.',
  },
];

const TermsScreen: React.FC<Props> = () => {
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
      <Text style={styles.versionText}>앱 버전: v{APP_VERSION}</Text>

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
    marginBottom: spacing.xs,
  },
  versionText: {
    ...typography.caption,
    color: colors.gray400,
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

export default TermsScreen;
