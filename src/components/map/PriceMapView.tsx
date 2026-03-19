import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MapViewWrapper from './MapViewWrapper';
import { colors } from '../../theme/colors';
import { formatPrice } from '../../utils/format';

export interface PriceMarkerItem {
  id: string;
  price: number;
  storeName: string;
  latitude: number;
  longitude: number;
}

interface Props {
  prices: PriceMarkerItem[];
  onMarkerPress?: (id: string) => void;
  initialLatitude: number;
  initialLongitude: number;
}

const PriceMapView: React.FC<Props> = ({
  prices,
  onMarkerPress,
  initialLatitude,
  initialLongitude,
}) => {
  const minPrice = useMemo(() => {
    if (prices.length === 0) return null;
    return prices.reduce((min, p) => Math.min(min, p.price), Infinity);
  }, [prices]);

  return (
    <MapViewWrapper
      style={styles.map}
      initialCamera={{ latitude: initialLatitude, longitude: initialLongitude, zoom: 14 }}
      isShowLocationButton
      isShowZoomControls={false}
      minZoom={10}
      maxZoom={18}
      mapType="Basic"
      locale="ko"
    >
      {prices.map((p) => (
        <NaverMapMarkerOverlay
          key={p.id}
          latitude={p.latitude}
          longitude={p.longitude}
          onTap={() => onMarkerPress?.(p.id)}
          tintColor={p.price === minPrice ? colors.danger : colors.primary}
          caption={{
            text: formatPrice(p.price),
            textSize: 12,
            color: p.price === minPrice ? colors.danger : colors.primary,
          }}
          subCaption={{
            text: p.storeName,
            textSize: 10,
          }}
        />
      ))}
    </MapViewWrapper>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default React.memo(PriceMapView);
