import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MyPageScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { inquiryApi } from '../../api/inquiry.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';

type Props = MyPageScreenProps<'Inquiry'>;

const InquiryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const [email, setEmail] = useState(user?.email ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    // 유효성 검사
    if (!email.trim()) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('입력 오류', '내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await inquiryApi.createInquiry({
        email: email.trim(),
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('성공', '문의가 접수되었습니다. 빠른 답변 부탁드립니다.');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('문의 제출 실패:', error);
      let message = '문의 제출에 실패했습니다.';

      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        } else if (response?.status === 400) {
          message = '입력값이 올바르지 않습니다.';
        }
      }

      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  }, [email, title, content, navigation]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ChevronLeftIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>문의하기</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 이메일 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>이메일 *</Text>
          <TextInput
            style={styles.input}
            placeholder="답변 받을 이메일"
            placeholderTextColor={colors.gray400}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="이메일 입력"
          />
        </View>

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="문의 제목"
            placeholderTextColor={colors.gray400}
            value={title}
            onChangeText={setTitle}
            editable={!loading}
            maxLength={100}
            accessibilityLabel="제목 입력"
          />
        </View>

        {/* 내용 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>내용 *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="문의 내용을 입력해주세요"
            placeholderTextColor={colors.gray400}
            value={content}
            onChangeText={setContent}
            editable={!loading}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            accessibilityLabel="내용 입력"
          />
        </View>
      </ScrollView>

      {/* 버튼 영역 */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="문의 보내기"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>문의 보내기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },

  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },

  title: {
    ...typography.headingMd,
    flex: 1,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  section: {
    marginBottom: spacing.xl,
  },

  label: {
    ...typography.bodySm,
    fontWeight: '600' as const,
    color: colors.black,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },

  contentInput: {
    height: 200,
    paddingTop: spacing.md,
  },

  bottomArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
  },

  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.5,
  },

  submitButtonText: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.white,
  },
});

export default InquiryScreen;
