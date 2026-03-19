import React, { useMemo } from 'react';
import type { PriceResponse } from '../../types/api.types';
import { useLocationStore } from '../../store/locationStore';
import MapPriceView from '../map/PriceMapView';

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

interface Props {
  prices: PriceResponse[];
  onMarkerPress: (storeId: string) => void;
}

const PriceMapView: React.FC<Props> = ({ prices, onMarkerPress }) => {
  const { latitude, longitude } = useLocationStore();

  const priceMarkers = useMemo(() => {
    const seen = new Set<string>();
    return prices
      .filter((p) => {
        if (seen.has(p.store.id)) return false;
        seen.add(p.store.id);
        return true;
      })
      .map((p) => ({
        id: p.store.id,
        price: p.price,
        storeName: p.store.name,
        latitude: p.store.latitude,
        longitude: p.store.longitude,
      }));
  }, [prices]);

  if (prices.length === 0) {
    return null;
  }

  const initialLat = latitude ?? prices[0]?.store.latitude ?? DEFAULT_LAT;
  const initialLng = longitude ?? prices[0]?.store.longitude ?? DEFAULT_LNG;

  return (
    <MapPriceView
      prices={priceMarkers}
      onMarkerPress={onMarkerPress}
      initialLatitude={initialLat}
      initialLongitude={initialLng}
    />
  );
};

export default React.memo(PriceMapView);
