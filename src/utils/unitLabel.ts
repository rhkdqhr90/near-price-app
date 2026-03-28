import type { UnitType } from '../types/api.types';

/** 영문 UnitType → 한국어 라벨 */
const UNIT_LABELS: Record<UnitType, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'L',
  count: '개',
  bunch: '묶음',
  pack: '팩',
  bag: '봉',
  other: '기타',
};

/** UnitType을 한국어 표시용 문자열로 변환 */
export const getUnitLabel = (unitType: UnitType | string | null | undefined): string => {
  if (!unitType) return '기타';
  return UNIT_LABELS[unitType as UnitType] ?? unitType;
};
