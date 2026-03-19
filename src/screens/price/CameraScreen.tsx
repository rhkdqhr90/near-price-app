import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PriceRegisterScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = PriceRegisterScreenProps<'Camera'>;

const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 접근 권한을 허용해주세요.');
    }
  }, [requestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto();
      navigation.navigate('OcrResult', { imageUri: `file://${photo.path}` });
    } catch {
      Alert.alert('오류', '사진 촬영에 실패했습니다. 다시 시도해주세요.');
    }
  }, [navigation]);

  const handlePickFromGallery = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) { Alert.alert('오류', '이미지를 불러오는 데 실패했습니다.'); return; }
      const uri = response.assets?.[0]?.uri;
      if (uri) navigation.navigate('OcrResult', { imageUri: uri });
    });
  }, [navigation]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>카메라 권한이 필요합니다</Text>
        <Text style={styles.permSub}>가격표 사진 촬영을 위해 카메라 접근 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
          <Text style={styles.permBtnText}>권한 허용하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryAltBtn} onPress={handlePickFromGallery}>
          <Text style={styles.galleryAltText}>갤러리에서 선택</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>카메라를 사용할 수 없습니다</Text>
        <TouchableOpacity style={styles.galleryAltBtn} onPress={handlePickFromGallery}>
          <Text style={styles.galleryAltText}>갤러리에서 선택</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} device={device} isActive photo />
      <View style={[styles.overlay, { paddingBottom: insets.bottom + spacing.xxl + spacing.lg }]}>
        <Text style={styles.guideText}>가격표를 촬영해주세요</Text>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
            <Text style={styles.galleryBtnText}>갤러리</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shutterBtn} onPress={handleTakePhoto}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xxl, alignItems: 'center',
  },
  guideText: { ...typography.body, color: colors.white, marginBottom: spacing.xxl, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  galleryBtn: {
    width: spacing.cameraControlSize, height: spacing.cameraControlSize, borderRadius: 12,
    backgroundColor: colors.cameraOverlayDark, justifyContent: 'center', alignItems: 'center',
  },
  galleryBtnText: { ...typography.bodySm, color: colors.white, fontWeight: '600' as const },
  shutterBtn: {
    width: spacing.cameraShutterSize, height: spacing.cameraShutterSize,
    borderRadius: spacing.cameraShutterSize / 2,
    backgroundColor: colors.cameraShutterBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: colors.white,
  },
  shutterInner: {
    width: spacing.cameraControlSize, height: spacing.cameraControlSize,
    borderRadius: spacing.cameraControlSize / 2,
    backgroundColor: colors.white,
  },
  placeholder: { width: spacing.cameraControlSize },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray100, padding: spacing.xxl },
  permTitle: { ...typography.headingXl, textAlign: 'center', marginBottom: spacing.sm },
  permSub: { ...typography.body, color: colors.gray600, textAlign: 'center', marginBottom: spacing.xxl },
  permBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.inputPad,
    paddingHorizontal: spacing.xxl, marginBottom: spacing.md, alignItems: 'center', width: '100%', // 14: no exact spacing token
  },
  permBtnText: { fontSize: 15, fontWeight: '600' as const, color: colors.white },
  galleryAltBtn: {
    backgroundColor: colors.white, borderRadius: 12, paddingVertical: spacing.inputPad,
    paddingHorizontal: spacing.xxl, borderWidth: 0.5, borderColor: colors.gray200, alignItems: 'center', width: '100%', // 14: no exact spacing token
  },
  galleryAltText: { fontSize: 15, fontWeight: '600' as const, color: colors.black },
});

export default CameraScreen;
