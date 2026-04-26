import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FlyerProductItem } from '../../types/api.types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatPrice } from '../../utils/format';

interface Props {
  product: FlyerProductItem | null;
  onClose: () => void;
  onRegisterPrice?: () => void;
}

type BadgeType = 'red' | 'yellow' | 'blue';

const BADGE_BG: Record<BadgeType, string> = {
  red: colors.flyerRed,
  yellow: colors.flyerBadgeYellow,
  blue: colors.flyerBadgeBlue,
};
const BADGE_TEXT: Record<BadgeType, string> = {
  red: colors.white,
  yellow: colors.black,
  blue: colors.white,
};

const ProductDetailModal: React.FC<Props> = ({ product, onClose, onRegisterPrice }) => {
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => setImageError(true), []);

  // product가 바뀌면 imageError 초기화
  useEffect(() => {
    setImageError(false);
  }, [product?.id]);

  const imageUri = product?.imageUrl ?? null;
  const badges = product?.badges ?? [];

  const savePct =
    product?.originalPrice && product.originalPrice > 0
      ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
      : null;

  const handleRegisterPrice = useCallback(() => {
    onClose();
    onRegisterPrice?.();
  }, [onClose, onRegisterPrice]);

  return (
    <Modal
      visible={product !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="모달 닫기"
      >
        {/* TouchableOpacity 이벤트 버블링 차단을 위해 내부 View를 별도 TouchableOpacity로 */}
        <TouchableOpacity
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}
          activeOpacity={1}
          onPress={() => { /* 내부 클릭은 닫히지 않음 */ }}
        >
          {/* 드래그 핸들 */}
          <View style={styles.handle} />

          {/* 상품 이미지 영역 */}
          <View style={styles.imageArea}>
            {imageUri && !imageError ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.productImage}
                resizeMode="contain"
                onError={handleImageError}
              />
            ) : (
              <View style={styles.emojiBox}>
                <Text style={styles.emojiText}>{product?.emoji ?? '🛒'}</Text>
              </View>
            )}
          </View>

          {/* 뱃지 */}
          {badges.length > 0 && (
            <View style={styles.badgeRow}>
              {badges.map((badge) => (
                <View
                  key={badge.label}
                  style={[styles.badge, { backgroundColor: BADGE_BG[badge.type] }]}
                >
                  <Text style={[styles.badgeText, { color: BADGE_TEXT[badge.type] }]}>
                    {badge.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 상품명 */}
          <Text style={styles.productName}>{product?.name}</Text>

          {/* 가격 영역 */}
          <View style={styles.priceSection}>
            {product?.originalPrice != null && (
              <Text style={styles.originalPrice}>
                정가 {formatPrice(product.originalPrice)}
              </Text>
            )}
            <View style={styles.salePriceRow}>
              <Text style={styles.salePrice}>{formatPrice(product?.salePrice ?? 0)}</Text>
              {savePct !== null && savePct > 0 && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{savePct}% 할인</Text>
                </View>
              )}
            </View>
          </View>

          {/* 버튼 영역 */}
          <View style={styles.btnRow}>
            {onRegisterPrice && (
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleRegisterPrice}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="이 상품 가격 등록하기"
              >
                <Text style={styles.registerBtnText}>📝 가격 등록하기</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.closeBtn, onRegisterPrice ? styles.closeBtnNarrow : null]}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },

  // 이미지 영역
  imageArea: {
    width: '100%',
    height: 220,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.gray100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  emojiBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  emojiText: {
    fontSize: 72,
  },

  // 뱃지
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusSm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },

  // 상품명 · 가격
  productName: {
    ...typography.headingLg,
    color: colors.black,
    marginBottom: spacing.lg,
    lineHeight: 30,
  },
  priceSection: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  originalPrice: {
    ...typography.bodySm,
    color: colors.gray400,
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  salePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  salePrice: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.flyerRed,
    letterSpacing: -1,
    lineHeight: 38,
  },
  saveBadge: {
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveBadgeText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.danger,
  },

  // 버튼 영역
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  registerBtn: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  registerBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700' as const,
  },
  closeBtn: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  closeBtnNarrow: {
    flex: 0,
    paddingHorizontal: spacing.xl,
  },
  closeBtnText: {
    ...typography.body,
    color: colors.gray700,
    fontWeight: '700' as const,
  },
});

export default ProductDetailModal;
